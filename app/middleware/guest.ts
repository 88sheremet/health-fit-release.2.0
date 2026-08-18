export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  // Получаем текущего пользователя
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Пользователь не авторизован —
  // остаёмся на login/register
  if (!user) {
    return;
  }

  // Проверяем, проходил ли пользователь скрининг
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

    // При ошибке не отправляем пользователя
    // сразу на daily
    return;
  }

  // Новый пользователь — скрининг ещё не проходил
  if (!screening) {
    return navigateTo("/welcome");
  }

  // Скрининг уже пройден
  return navigateTo("/daily");
});