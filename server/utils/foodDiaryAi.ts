
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
}

interface GeminiRequestParams {
  apiKey: string;
  model: string;
  prompt: string;
  systemPrompt: string;
}

export async function requestGemini(
  params: GeminiRequestParams,
): Promise<string> {
  if (!params.apiKey) {
    throw new Error("GEMINI_API_KEY не настроен.");
  }

  const model = encodeURIComponent(params.model);

  const response = await $fetch<GeminiResponse>(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      timeout: 45_000,
      headers: {
        "x-goog-api-key": params.apiKey,
      },
      body: {
        systemInstruction: {
          parts: [{ text: params.systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: params.prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1200,
        },
      },
    },
  );

  const candidate = response.candidates?.[0];
  const content = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error(
      `Gemini вернул пустой ответ. Причина: ${
        candidate?.finishReason ?? "неизвестна"
      }`,
    );
  }

  return content;
}
