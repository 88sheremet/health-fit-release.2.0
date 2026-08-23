<script setup lang="ts">
import { routes } from "~/router/routes";

const supabase = useSupabaseClient();

const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  await navigateTo(routes.auth.login);
} else {
  const { data: screening, error } = await supabase
    .from("screening_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error(
      "[Index] Ошибка проверки screening:",
      error,
    );

    await navigateTo(routes.onboarding.welcome);
  } else if (screening) {
    await navigateTo(routes.recovery.daily);
  } else {
    await navigateTo(routes.onboarding.welcome);
  }
}
</script>