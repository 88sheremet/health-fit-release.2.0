<template>
  <div class="page">
    <div class="header">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        class="back-btn"
        @click="goBack"
      />

      <div>
        <div class="title">
          {{ $t("settings.title") }}
        </div>

        <div class="subtitle">
          {{ $t("settings.subtitle") }}
        </div>
      </div>
    </div>

    <q-card class="settings-card">
      <div class="card-header">
        <div class="icon-wrapper language-icon">
          <q-icon name="language" size="26px" />
        </div>

        <div>
          <div class="card-title">
            {{ $t("settings.language.title") }}
          </div>

          <div class="card-subtitle">
            {{ $t("settings.language.subtitle") }}
          </div>
        </div>
      </div>

      <q-select
        v-model="selectedLocale"
        :options="localeOptions"
        emit-value
        map-options
        outlined
        dense
        class="language-select"
        :label="$t('settings.language.label')"
        @update:model-value="changeLanguage"
      />
    </q-card>

    <q-card class="settings-card">
      <div class="card-header">
        <div class="icon-wrapper password-icon">
          <q-icon name="lock" size="26px" />
        </div>

        <div>
          <div class="card-title">
            {{ $t("settings.password.title") }}
          </div>

          <div class="card-subtitle">
            {{ $t("settings.password.subtitle") }}
          </div>
        </div>
      </div>

      <div class="password-fields">
        <q-input
          v-model="currentPassword"
          outlined
          type="password"
          :label="$t('settings.password.currentPassword')"
          autocomplete="current-password"
          :error="!!currentPasswordError"
          :error-message="currentPasswordError"
        />

        <q-input
          v-model="newPassword"
          outlined
          :type="showPassword ? 'text' : 'password'"
          :label="$t('settings.password.newPassword')"
          autocomplete="new-password"
          :error="!!passwordError"
          :error-message="passwordError"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          outlined
          :type="showConfirmPassword ? 'text' : 'password'"
          :label="$t('settings.password.confirmPassword')"
          autocomplete="new-password"
          :error="!!confirmPasswordError"
          :error-message="confirmPasswordError"
        >
          <template #append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>

        <q-btn
          color="primary"
          unelevated
          no-caps
          class="password-btn"
          :label="$t('settings.password.button')"
          :loading="loading"
          @click="changePassword"
        />
      </div>
    </q-card>
    <LogoutButton />

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import LogoutButton from "~/components/auth/LogoutButton.vue";
import { routes } from "~/router/routes";
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

const router = useRouter();
const supabase = useSupabaseClient();
const $q = useQuasar();
const { locale, locales, setLocale, t } = useI18n();

const newPassword = ref("");
const confirmPassword = ref("");
const currentPassword = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(false);

const selectedLocale = ref(locale.value);

const localeOptions = computed(() =>
  locales.value.map((item) => ({
    label: item.name,
    value: item.code,
  }))
);

const passwordError = ref("");
const confirmPasswordError = ref("");
const currentPasswordError = ref("");

const validateCurrentPassword = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
]);

const validateNewPassword = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
  { check: minLength(6), message: t("auth.minPassword") },
]);

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push(routes.recovery.menu);
  }
}

async function changeLanguage(value: "ru" | "uk") {
  await setLocale(value);
  selectedLocale.value = value;
}

async function changePassword() {
  passwordError.value = "";
  confirmPasswordError.value = "";
  currentPasswordError.value = "";

  const curError = validateCurrentPassword(currentPassword.value);
  if (curError) {
    currentPasswordError.value = curError;
    return;
  }

  const pwError = validateNewPassword(newPassword.value);
  if (pwError) {
    passwordError.value = pwError;
    return;
  }

  if (!matchesField(newPassword.value)(confirmPassword.value)) {
    confirmPasswordError.value = t("auth.passwordMismatch");
    return;
  }

  loading.value = true;

  try {
    const { data: user } = await supabase.auth.getUser();
    const email = user.user?.email;

    if (!email) {
      passwordError.value = t("settings.password.error");
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword.value,
    });

    if (authError) {
      currentPasswordError.value = t("settings.password.wrongPassword");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    if (error) {
      passwordError.value = t("settings.password.error");
      return;
    }

    await supabase.auth.signOut({ scope: "others" });

    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";

    $q.notify({
      type: "positive",
      message: t("settings.password.success"),
    });
  } catch (error) {
    passwordError.value = t("settings.password.error");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px 20px 100px;
  background: var(--bg-gradient-main);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.back-btn {
  color: var(--grey);
}

.title {
  font-size: 30px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  color: var(--grey);
  font-size: 15px;
}

.settings-card {
  padding: 24px;
  margin-bottom: 20px;
  border-radius: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}

.icon-wrapper {
  width: 52px;
  height: 52px;
  border-radius: 16px;

  display: flex;
  align-items: center;
  justify-content: center;
}

.language-icon {
  background: var(--green-bg);
  color: var(--green);
}

.password-icon {
  background: var(--grey-icon-bg);
  color: var(--toast-info);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
}

.card-subtitle {
  margin-top: 4px;
  color: var(--grey);
  font-size: 14px;
}

.language-select {
  width: 100%;
}

.password-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.password-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  margin-top: 4px;
}

@media (max-width: 600px) {
  .page {
    padding: 20px 16px 100px;
  }

  .settings-card {
    padding: 20px;
  }

  .title {
    font-size: 26px;
  }
}
</style>