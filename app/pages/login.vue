<template>
  <div class="login-page">
    <div class="login-card">
      <h1>{{ $t("auth.loginTitle") }}</h1>

      <form @submit.prevent="login">
        <q-input
          v-model="email"
          :label="$t('auth.email')"
          type="email"
          outlined
          class="q-mb-md"
        />

        <q-input
          v-model="password"
          :label="$t('auth.password')"
          type="password"
          outlined
          class="q-mb-md"
        />

        <div v-if="errorMessage" class="login-error">
          {{ errorMessage }}
        </div>

        <q-btn
          :label="$t('auth.loginBtn')"
          color="primary"
          unelevated
          class="full-width"
          :loading="loading"
          type="submit"
        />
      </form>

      <div class="login-links">
        <NuxtLink :to="routes.auth.register">
          {{ $t("auth.registerLink") }}
         </NuxtLink>

        <NuxtLink :to="routes.auth.forgotPassword">
          {{ $t("auth.forgotPassword") }}
         </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";

definePageMeta({
  middleware: "guest",
});

const supabase = useSupabaseClient();
const router = useRouter();

const email = ref("");
const password = ref("");

const loading = ref(false);
const errorMessage = ref("");
const { t } = useI18n();

const validateEmail = createValidator([
  { check: isRequired, message: t("auth.loginError") },
  { check: isEmail, message: t("auth.invalidEmail") },
]);

const login = async () => {
  errorMessage.value = "";

  const validationError = validateForm(
    validateEmail(email.value),
    !isRequired(password.value) ? t("auth.loginError") : null
  );

  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  loading.value = true;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    loading.value = false;
    errorMessage.value = error.message;
    return;
  }

  const user = data.user;

  if (!user) {
    loading.value = false;
    errorMessage.value = t("auth.loginError");
    return;
  }

  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  loading.value = false;

  if (screeningError) {
    errorMessage.value = screeningError.message;
    return;
  }

  if (screeningResult) {
    await router.push(routes.recovery.daily);
    return;
  }

  await router.push(routes.onboarding.welcome);
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-error {
  margin-bottom: 16px;
  color: #d32f2f;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.login-links a {
  color: var(--green);
  text-decoration: none;
}
</style>