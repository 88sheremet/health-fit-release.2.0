<template>
  <div class="callback-page">
    <q-spinner color="primary" size="50px" />

    <div class="callback-text">
      {{ $t("auth.googleLoading") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { routes } from "~/router/routes";

definePageMeta({
  layout: false,
});

const supabase = useSupabaseClient();
const router = useRouter();
const route = useRoute();

const redirectAfterGoogleLogin = async () => {
  console.log("[Auth Callback] Starting Google callback...");

  const code = route.query.code;

  if (typeof code === "string" && code) {
    console.log("[Auth Callback] OAuth code found");

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      console.error("[Auth Callback] Code exchange error:", exchangeError);

      await router.replace(routes.auth.login);
      return;
    }

    console.log("[Auth Callback] OAuth code exchanged successfully");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("[Auth Callback] Session error:", sessionError);

    await router.replace(routes.auth.login);
    return;
  }

  if (!session?.user) {
    console.error("[Auth Callback] User session not found");

    await router.replace(routes.auth.login);
    return;
  }

  const user = session.user;

  console.log("[Auth Callback] Google user:", user.id);

  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (screeningError) {
    console.error("[Auth Callback] Screening check error:", screeningError);

    await router.replace(routes.auth.login);
    return;
  }

  if (screeningResult) {
    console.log("[Auth Callback] Screening found → Daily");

    await router.replace(routes.recovery.daily);
    return;
  }

  console.log("[Auth Callback] No screening → Welcome");

  await router.replace(routes.onboarding.welcome);
};

onMounted(async () => {
  try {
    await redirectAfterGoogleLogin();
  } catch (error) {
    console.error("[Auth Callback] Unexpected error:", error);

    await router.replace(routes.auth.login);
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: var(--bg-gradient-main);
}

.callback-text {
  font-size: 16px;
  color: var(--grey);
}
</style>
