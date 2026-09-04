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
          :disable="loading || googleLoading"
        />

        <q-input
          v-model="password"
          :label="$t('auth.password')"
          type="password"
          outlined
          class="q-mb-md"
          :disable="loading || googleLoading"
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
          :disable="googleLoading"
          type="submit"
        />
      </form>

      <div class="oauth-divider">
        <span>{{ $t("auth.loginTitle") }} {{ $t("auth.or") }}</span>
      </div>

      <q-btn
        unelevated
        no-caps
        class="google-btn full-width"
        :loading="googleLoading"
        :disable="loading"
        @click="loginWithGoogle"
      >
        <template #default>
          <span v-if="!googleLoading" class="google-icon"> G </span>

          <span class="google-text">
            {{ $t("auth.googleLogin") }}
          </span>
        </template>
      </q-btn>

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
const { t } = useI18n();

const email = ref("");
const password = ref("");

const loading = ref(false);
const googleLoading = ref(false);
const errorMessage = ref("");

const validateEmail = createValidator([
  {
    check: isRequired,
    message: t("auth.loginError"),
  },
  {
    check: isEmail,
    message: t("auth.invalidEmail"),
  },
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

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      errorMessage.value = error.message;
      return;
    }

    const user = data.user;

    if (!user) {
      errorMessage.value = t("auth.loginError");
      return;
    }

    await redirectAfterLogin(user.id);
  } catch (error) {
    console.error("[Auth] Login error:", error);

    errorMessage.value = t("auth.loginError");
  } finally {
    loading.value = false;
  }
};

const loginWithGoogle = async () => {
  errorMessage.value = "";
  googleLoading.value = true;

  try {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error("[Auth] Google login error:", error);

      errorMessage.value = error.message;
      googleLoading.value = false;
    }
  } catch (error) {
    console.error("[Auth] Google login unexpected error:", error);

    errorMessage.value = t("auth.loginError");
    googleLoading.value = false;
  }
};

const redirectAfterLogin = async (userId: string) => {
  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (screeningError) {
    console.error("[Auth] Screening check error:", screeningError);

    errorMessage.value = screeningError.message;
    return;
  }

  if (screeningResult) {
    await router.replace(routes.recovery.daily);
    return;
  }

  await router.replace(routes.onboarding.welcome);
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
  color: var(--red);
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

.login-links {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
}

.login-links a {
  color: var(--green);
  text-decoration: none;
}
</style>