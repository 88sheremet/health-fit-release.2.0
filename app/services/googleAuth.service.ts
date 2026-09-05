import { routes } from "~/router/routes";

export type GoogleAuthDestination =
  | (typeof routes.auth.login)
  | (typeof routes.recovery.daily)
  | (typeof routes.onboarding.welcome);

export const GOOGLE_CALLBACK_PATH = "/auth/callback";

export async function signInWithGoogle(): Promise<void> {
  const supabase = useSupabaseClient();

  const redirectTo = `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function getGoogleAuthDestination(
  code?: unknown,
): Promise<GoogleAuthDestination> {
  const supabase = useSupabaseClient();

  if (typeof code === "string" && code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code,
    );

    if (exchangeError) {
      return routes.auth.login;
    }
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return routes.auth.login;
  }

  const user = session.user;

  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (screeningError) {
    return routes.auth.login;
  }

  if (screeningResult) {
    return routes.recovery.daily;
  }

  return routes.onboarding.welcome;
}