import { routes } from "~/router/routes";

export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[auth middleware] Session error:", error);
    return navigateTo(routes.auth.login);
  }

  if (!session) {
    return navigateTo(routes.auth.login);
  }
});