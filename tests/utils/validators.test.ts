import { describe, it, expect } from "vitest";
import {
  isRequired,
  isEmail,
  minLength,
  matchesField,
  createValidator,
  validateForm,
} from "~/utils/validators";

describe("isRequired", () => {
  it("returns false for empty string", () => {
    expect(isRequired("")).toBe(false);
  });

  it("returns false for whitespace-only string", () => {
    expect(isRequired("   ")).toBe(false);
  });

  it("returns true for non-empty string", () => {
    expect(isRequired("hello")).toBe(true);
  });

  it("returns true for string with leading/trailing spaces", () => {
    expect(isRequired(" hello ")).toBe(true);
  });
});

describe("isEmail", () => {
  it("rejects empty string", () => {
    expect(isEmail("")).toBe(false);
  });

  it("rejects missing @", () => {
    expect(isEmail("userexample.com")).toBe(false);
  });

  it("rejects missing domain", () => {
    expect(isEmail("user@")).toBe(false);
  });

  it("rejects missing TLD", () => {
    expect(isEmail("user@example")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isEmail("user @example.com")).toBe(false);
  });

  it("accepts simple valid email", () => {
    expect(isEmail("user@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(isEmail("user@mail.example.com")).toBe(true);
  });

  it("accepts email with plus alias", () => {
    expect(isEmail("user+tag@example.com")).toBe(true);
  });
});

describe("minLength", () => {
  it("returns false when value is shorter than min", () => {
    const check = minLength(6);
    expect(check("12345")).toBe(false);
  });

  it("returns true when value equals min", () => {
    const check = minLength(6);
    expect(check("123456")).toBe(true);
  });

  it("returns true when value exceeds min", () => {
    const check = minLength(6);
    expect(check("1234567")).toBe(true);
  });

  it("works with min 0", () => {
    const check = minLength(0);
    expect(check("")).toBe(true);
  });
});

describe("matchesField", () => {
  it("returns true when values match", () => {
    const check = matchesField("password123");
    expect(check("password123")).toBe(true);
  });

  it("returns false when values differ", () => {
    const check = matchesField("password123");
    expect(check("password456")).toBe(false);
  });

  it("returns false for empty vs non-empty", () => {
    const check = matchesField("something");
    expect(check("")).toBe(false);
  });

  it("is case-sensitive", () => {
    const check = matchesField("Password");
    expect(check("password")).toBe(false);
  });
});

describe("createValidator", () => {
  const validateEmail = createValidator([
    { check: isRequired, message: "Email is required" },
    { check: isEmail, message: "Invalid email" },
  ]);

  it("returns first error message on failure", () => {
    expect(validateEmail("")).toBe("Email is required");
  });

  it("returns second error when first rule passes", () => {
    expect(validateEmail("notanemail")).toBe("Invalid email");
  });

  it("returns null when all rules pass", () => {
    expect(validateEmail("user@example.com")).toBeNull();
  });

  it("returns null for empty rules array", () => {
    const validate = createValidator([]);
    expect(validate("anything")).toBeNull();
  });
});

describe("validateForm", () => {
  it("returns null when all results are null", () => {
    expect(validateForm(null, null, null)).toBeNull();
  });

  it("returns first error", () => {
    expect(validateForm(null, "error two", "error three")).toBe("error two");
  });

  it("returns null for empty arguments", () => {
    expect(validateForm()).toBeNull();
  });

  it("works with createValidator output", () => {
    const validateEmail = createValidator([
      { check: isRequired, message: "Required" },
    ]);

    const result = validateForm(validateEmail(""), validateEmail("a@b.c"));
    expect(result).toBe("Required");
  });
});
