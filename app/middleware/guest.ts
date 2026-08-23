export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();


  if (!user) {
    return;
  }

  const { data: screening, error } = await supabase
    .from("screening_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "[Guest Middleware] Ошибка проверки screening:",
      error
    );

    return;
  }

  if (!screening) {
    return navigateTo("/welcome");
  }

  return navigateTo("/daily");
});