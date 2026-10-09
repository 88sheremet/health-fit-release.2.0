export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("gender")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[Guest Middleware] Ошибка проверки профиля:", profileError);
    return;
  }

  if (!profile?.gender) {
    return navigateTo("/profile-setup");
  }

  const { data: screening, error: screeningError } = await supabase
    .from("screening_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (screeningError) {
    console.error(
      "[Guest Middleware] Ошибка проверки screening:",
      screeningError,
    );
    return;
  }

  return navigateTo(screening ? "/daily" : "/welcome");
});
