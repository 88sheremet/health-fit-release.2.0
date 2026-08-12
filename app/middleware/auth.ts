export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("[auth middleware] Session error:", error);
    return navigateTo("/login");
  }

  if (!session) {
    return navigateTo("/login");
  }
});