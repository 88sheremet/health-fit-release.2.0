export type AuthContext = "login" | "register";

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

export function authErrorKey(
  error: unknown,
  context: AuthContext,
): string | null {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  if (typeof code !== "string") return null;

  if (RATE_LIMIT_CODES.has(code)) return "auth.errors.rateLimit";

  if (context === "login") {
    if (code === "invalid_credentials") return "auth.errors.invalidCredentials";
    if (code === "email_not_confirmed") return "auth.errors.emailNotConfirmed";
    return null;
  }

  if (code === "user_already_exists" || code === "email_exists") {
    return "auth.errors.userExists";
  }

  if (code === "weak_password") return "auth.errors.weakPassword";

  return null;
}
