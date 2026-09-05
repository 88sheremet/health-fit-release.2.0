<template>
  <div class="register-page">
    <div class="register-card">
      <h1>{{ $t("auth.registerTitle") }}</h1>

      <!-- Email -->
      <q-input
        v-model="email"
        :label="$t('auth.email')"
        type="email"
        outlined
        autocomplete="email"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!-- Password -->
      <q-input
        v-model="password"
        :label="$t('auth.password')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!-- Confirm password -->
      <q-input
        v-model="confirmPassword"
        :label="$t('auth.confirmPassword')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!-- Error -->
      <div v-if="errorMessage" class="register-error">
        {{ errorMessage }}
      </div>

      <!-- Success -->
      <div v-if="successMessage" class="register-success">
        {{ successMessage }}
      </div>

      <!-- Email registration -->
      <q-btn
        :label="$t('auth.registerBtn')"
        color="primary"
        unelevated
        class="full-width"
        :loading="loading"
        :disable="googleLoading"
        @click="register"
      />

      <!-- OAuth divider -->
      <div class="oauth-divider">
        <span>{{ $t("auth.or") }}</span>
      </div>

      <!-- Google registration -->
      <q-btn
        unelevated
        no-caps
        class="google-btn full-width"
        :loading="googleLoading"
        :disable="loading"
        @click="registerWithGoogle"
      >
        <template #default>
          <span v-if="!googleLoading" class="google-icon"> G </span>

          <span class="google-text">
            {{ $t("auth.googleRegister") }}
          </span>
        </template>
      </q-btn>

      <!-- Login -->
      <div class="register-links">
        <span>{{ $t("auth.haveAccount") }}</span>

        <NuxtLink :to="routes.auth.login">
          {{ $t("auth.loginBtn") }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";
import { signInWithGoogle } from "~/services/googleAuth.service";

definePageMeta({
  middleware: "guest",
});

const supabase = useSupabaseClient();
const router = useRouter();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const loading = ref(false);
const googleLoading = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const validateEmail = createValidator([
  {
    check: isRequired,
    message: t("auth.fillAllFields"),
  },
  {
    check: isEmail,
    message: t("auth.invalidEmail"),
  },
]);

const validatePassword = createValidator([
  {
    check: isRequired,
    message: t("auth.fillAllFields"),
  },
  {
    check: minLength(6),
    message: t("auth.minPassword"),
  },
]);

const register = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  const validationError = validateForm(
    validateEmail(email.value),
    validatePassword(password.value),
    !isRequired(confirmPassword.value) ? t("auth.fillAllFields") : null,
    !matchesField(password.value)(confirmPassword.value)
      ? t("auth.passwordMismatch")
      : null
  );

  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) {
      console.error("[Auth] Registration error:", error);

      errorMessage.value = error.message;
      return;
    }

    if (data.session) {
      console.log("[Auth] Registration successful → Welcome");

      await router.replace(routes.onboarding.welcome);
      return;
    }

    successMessage.value = t("auth.registerSuccess");
  } catch (error) {
    console.error("[Auth] Registration unexpected error:", error);

    errorMessage.value = t("auth.registerError");
  } finally {
    loading.value = false;
  }
};

const registerWithGoogle = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  googleLoading.value = true;

  try {
    await signInWithGoogle();
  } catch (error) {
    console.error("[Auth] Google registration error:", error);

    errorMessage.value =
      error instanceof Error ? error.message : t("auth.registerError");
    googleLoading.value = false;
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

  color: var(--red);
  font-size: 14px;
}

.register-success {
  margin-bottom: 16px;

  color: var(--green);
  font-size: 14px;
}

.oauth-divider {
  display: flex;
  align-items: center;
  gap: 12px;

  margin: 24px 0;

  color: var(--grey);
  font-size: 14px;
}

.oauth-divider::before,
.oauth-divider::after {
  content: "";

  flex: 1;

  height: 1px;

  background: var(--border-default);
}

.google-btn {
  height: 48px;

  border-radius: 12px;

  background: var(--white);
  color: var(--black1);

  border: 1px solid var(--border-default);

  font-size: 15px;
  font-weight: 600;

  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}

.google-btn:hover {
  background: var(--grey-hover);
  border-color: var(--green);
}

.google-btn:active {
  transform: scale(0.98);
}

.google-icon {
  width: 22px;
  height: 22px;

  margin-right: 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-family: Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;

  color: #4285f4;
}

.google-text {
  line-height: 1;
}

.register-links {
  display: flex;
  justify-content: center;
  align-items: center;

  gap: 6px;

  margin-top: 20px;
}

.register-links a {
  color: var(--green);

  text-decoration: none;
}
</style>
