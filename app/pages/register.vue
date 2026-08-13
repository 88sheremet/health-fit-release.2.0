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

        <NuxtLink to="/login"> {{ $t("auth.loginBtn") }} </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const emailValue = email.value.trim();

  if (!emailValue || !password.value || !confirmPassword.value) {
    errorMessage.value = t("auth.fillAllFields");
    return;
  }

  if (!emailRegex.test(emailValue)) {
    errorMessage.value = t("auth.invalidEmail");
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = t("auth.minPassword");
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t("auth.passwordMismatch");
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: emailValue,
      password: password.value,
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    if (data.session) {
      await router.push("/daily");
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