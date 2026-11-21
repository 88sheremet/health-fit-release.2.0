import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { requestGemini } from "../../server/utils/foodDiaryAi";

const baseParams = {
  apiKey: "test-key",
  model: "gemini-2.0-flash",
  prompt: "Опиши рацион",
  systemPrompt: "Ты нутрициолог",
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("$fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("requestGemini", () => {
  it("throws when the API key is missing", async () => {
    await expect(
      requestGemini({ ...baseParams, apiKey: "" })
    ).rejects.toThrow("GEMINI_API_KEY не настроен.");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the prompt to the Gemini endpoint", async () => {
    fetchMock.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });

    await requestGemini(baseParams);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        timeout: 45_000,
        headers: { "x-goog-api-key": "test-key" },
        body: {
          systemInstruction: { parts: [{ text: "Ты нутрициолог" }] },
          contents: [{ role: "user", parts: [{ text: "Опиши рацион" }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 1200,
          },
        },
      }
    );
  });

  it("encodes the model name in the URL", async () => {
    fetchMock.mockResolvedValue({
      candidates: [{ content: { parts: [{ text: "ok" }] } }],
    });

    await requestGemini({ ...baseParams, model: "models/gemini 2.0" });

    expect(fetchMock.mock.calls[0][0]).toContain(
      "models/models%2Fgemini%202.0:generateContent"
    );
  });

  it("joins and trims all text parts", async () => {
    fetchMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [{ text: "  Часть 1 " }, {}, { text: "часть 2  " }],
          },
        },
      ],
    });

    await expect(requestGemini(baseParams)).resolves.toBe("Часть 1 часть 2");
  });

  it("throws with the finish reason when the content is empty", async () => {
    fetchMock.mockResolvedValue({
      candidates: [{ finishReason: "SAFETY" }],
    });

    await expect(requestGemini(baseParams)).rejects.toThrow(
      "Gemini вернул пустой ответ. Причина: SAFETY"
    );
  });

  it("reports an unknown reason when there are no candidates", async () => {
    fetchMock.mockResolvedValue({});

    await expect(requestGemini(baseParams)).rejects.toThrow(
      "Gemini вернул пустой ответ. Причина: неизвестна"
    );
  });

  it("propagates transport errors", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(requestGemini(baseParams)).rejects.toThrow("network down");
  });
});
