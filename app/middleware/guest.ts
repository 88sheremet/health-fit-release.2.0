import { routes } from "~/router/routes";

export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[guest middleware] Session error:", error);
    return;
  }

  if (session) {
    return navigateTo(routes.recovery.daily);
  }
});