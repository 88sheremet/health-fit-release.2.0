<template>
  <div class="register-page">
    <div class="register-card">
      <h1>{{ $t("auth.registerTitle") }}</h1>

      <q-input
        v-model="email"
        :label="$t('auth.email')"
        type="email"
        outlined
        autocomplete="email"
        class="q-mb-md"
        :disable="loading"
      />

      <q-input
        v-model="password"
        :label="$t('auth.password')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading"
      />

      <q-input
        v-model="confirmPassword"
        :label="$t('auth.confirmPassword')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading"
      />

      <div v-if="errorMessage" class="register-error">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="register-success">
        {{ successMessage }}
      </div>

      <q-btn
        :label="$t('auth.registerBtn')"
        color="primary"
        unelevated
        class="full-width"
        :loading="loading"
        :disable="loading"
        @click="register"
      />

      <div class="register-links">
        <span>{{ $t("auth.haveAccount") }}</span>

        <NuxtLink :to="routes.auth.login"> {{ $t("auth.loginBtn") }} </NuxtLink>
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
const confirmPassword = ref("");

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const { t } = useI18n();

const validateEmail = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
  { check: isEmail, message: t("auth.invalidEmail") },
]);

const validatePassword = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
  { check: minLength(6), message: t("auth.minPassword") },
]);

const register = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const error = validateForm(
    validateEmail(email.value),
    validatePassword(password.value),
    !isRequired(confirmPassword.value) ? t("auth.fillAllFields") : null,
    !matchesField(password.value)(confirmPassword.value)
      ? t("auth.passwordMismatch")
      : null,
  );

  if (error) {
    errorMessage.value = error;
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

if (data.session) {
  await router.push(routes.onboarding.welcome);
  return;
}

    successMessage.value = t("auth.registerSuccess");
  } catch (error) {
    console.error("Registration error:", error);

    errorMessage.value = t("auth.registerError");
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.register-card {
  width: 100%;
  max-width: 400px;
}

.register-error {
  margin-bottom: 16px;
  color: #d32f2f;
}

.register-success {
  margin-bottom: 16px;
  color: var(--green);
}

.register-links {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
}

.register-links a {
  color: var(--green);
  text-decoration: none;
}
</style>