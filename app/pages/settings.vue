
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

    <!-- Language settings -->
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

    <!-- Push notification settings -->
    <q-card class="settings-card">
      <div class="card-header">
        <div class="icon-wrapper notification-icon">
          <q-icon name="notifications_active" size="26px" />
        </div>

        <div class="notification-header-content">
          <div class="card-title">
            {{ $t("settings.notifications.title") }}
          </div>

          <div class="card-subtitle">
            {{ $t("settings.notifications.subtitle") }}
          </div>
        </div>
      </div>

      <div class="notification-hint">
        <q-icon name="info" size="18px" />
        <span>
          {{ $t("settings.notifications.systemHint") }}
          {{ $t("settings.notifications.closedTabHint") }}
        </span>
      </div>

      <div v-if="!isPushSupported" class="notification-warning">
        <q-icon name="info" size="20px" />
        <span>
          {{ $t("settings.notifications.unsupported") }}
        </span>
      </div>

      <template v-else>
        <div class="notification-toggle">
          <div>
            <div class="notification-label">
              {{ $t("settings.notifications.enable") }}
            </div>

            <div class="notification-description">
              {{ pushEnabled
                ? $t("settings.notifications.enabled")
                : $t("settings.notifications.disabled")
              }}
            </div>
          </div>

          <q-toggle
            :model-value="pushEnabled"
            color="positive"
            :disable="pushLoading"
            @update:model-value="toggleNotifications"
          />
        </div>

        <q-separator class="notification-separator" />

        <div class="schedule-fields">
          <div class="field-label">
            {{ $t("settings.notifications.time") }}
          </div>

          <q-input
            v-model="pushTime"
            outlined
            dense
            type="time"
          />

          <div class="field-label">
            {{ $t("settings.notifications.days") }}
          </div>

          <div class="days-selector">
            <q-btn
              v-for="day in dayOptions"
              :key="day.value"
              :label="day.label"
              unelevated
              no-caps
              class="day-btn"
              :color="pushDays.includes(day.value) ? 'positive' : 'grey-4'"
              :text-color="pushDays.includes(day.value) ? 'white' : 'dark'"
              @click="toggleDay(day.value)"
            />
          </div>

          <div class="timezone-info">
            <q-icon name="schedule" size="16px" />
            <span>
              {{ $t("settings.notifications.timezone") }}:
              {{ timezone }}
            </span>
          </div>

          <div v-if="nextReminderAt" class="timezone-info next-reminder">
            <q-icon name="event" size="16px" />
            <span>
              {{ $t("settings.notifications.nextReminder") }}:
              {{ nextReminderAt }}
            </span>
          </div>

          <q-btn
            color="primary"
            unelevated
            no-caps
            class="schedule-btn"
            :label="$t('settings.notifications.save')"
            :loading="scheduleLoading"
            :disable="pushDays.length === 0 || !pushTime"
            @click="saveSchedule"
          />
        </div>

        <div
          v-if="permission === 'denied'"
          class="notification-warning permission-warning"
        >
          <q-icon name="warning" size="20px" />
          <span>
            {{ $t("settings.notifications.permissionDenied") }}
          </span>
        </div>
      </template>
    </q-card>

    <!-- Password settings -->
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
import { computed, onMounted, ref, watch } from "vue";
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

// Push notifications
const {
  settings: notificationSettings,
  permission,
  isSupported: isPushSupported,
  nextReminderAt,
  lastReminderFiredAt,
  lastReminderShown,
  loadSettings,
  updateSchedule,
  enableNotifications,
  disableNotifications,
} = usePushNotifications();

const pushEnabled = ref(false);
const pushTime = ref("09:30");
const pushDays = ref<number[]>([1, 2, 3, 4, 5, 6]);
const timezone = ref("UTC");

const pushLoading = ref(false);
const scheduleLoading = ref(false);

const dayOptions = computed(() => [
  { label: t("settings.notifications.mon"), value: 1 },
  { label: t("settings.notifications.tue"), value: 2 },
  { label: t("settings.notifications.wed"), value: 3 },
  { label: t("settings.notifications.thu"), value: 4 },
  { label: t("settings.notifications.fri"), value: 5 },
  { label: t("settings.notifications.sat"), value: 6 },
  { label: t("settings.notifications.sun"), value: 7 },
]);

function syncNotificationSettings() {
  pushEnabled.value = notificationSettings.value.enabled;
  pushTime.value = notificationSettings.value.reminder_time;
  pushDays.value = [...notificationSettings.value.days_of_week];
  timezone.value = notificationSettings.value.timezone;
}

async function initializeNotifications() {
  if (!isPushSupported.value) return;

  try {
    await loadSettings();
    syncNotificationSettings();
  } catch (error) {
    console.error("Failed to load notification settings:", error);

    $q.notify({
      type: "negative",
      message: t("settings.notifications.loadError"),
    });
  }
}

function toggleDay(day: number) {
  if (pushDays.value.includes(day)) {
    pushDays.value = pushDays.value.filter((item) => item !== day);
  } else {
    pushDays.value = [...pushDays.value, day].sort((a, b) => a - b);
  }
}

async function saveSchedule() {
  if (!pushDays.value.length) return;

  scheduleLoading.value = true;

  try {
    await updateSchedule(pushTime.value, pushDays.value);

    syncNotificationSettings();

    $q.notify({
      type: "positive",
      message: t("settings.notifications.saved"),
    });
  } catch (error) {
    console.error("Failed to save notification schedule:", error);

    $q.notify({
      type: "negative",
      message: t("settings.notifications.saveError"),
    });
  } finally {
    scheduleLoading.value = false;
  }
}

async function toggleNotifications(enabled: boolean) {
  pushLoading.value = true;

  try {
    if (enabled) {
      // Сначала сохраняем актуальное расписание.
      await updateSchedule(pushTime.value, pushDays.value);

      // Затем запрашиваем разрешение и создаём подписку.
      await enableNotifications();

      $q.notify({
        type: "positive",
        message: t("settings.notifications.enableSuccess"),
      });
    } else {
      await disableNotifications();

      $q.notify({
        type: "positive",
        message: t("settings.notifications.disableSuccess"),
      });
    }

    syncNotificationSettings();
  } catch (error) {
    console.error("Failed to toggle notifications:", error);

    syncNotificationSettings();

    $q.notify({
      type: "negative",
      message: t("settings.notifications.toggleError"),
    });
  } finally {
    pushLoading.value = false;
  }
}

// Language
const selectedLocale = ref(locale.value);

const localeOptions = computed(() =>
  locales.value.map((item) => ({
    label: item.name,
    value: item.code,
  }))
);

// Password
const newPassword = ref("");
const confirmPassword = ref("");
const currentPassword = ref("");

const showPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(false);

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

watch(lastReminderFiredAt, (value) => {
  if (!value) return;

  $q.notify({
    type: lastReminderShown.value ? "info" : "warning",
    message: t(
      lastReminderShown.value
        ? "settings.notifications.reminderFired"
        : "settings.notifications.reminderFailed",
    ),
  });
});

onMounted(() => {
  initializeNotifications();
});

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
  flex-shrink: 0;
}

.language-icon {
  background: var(--green-bg);
  color: var(--green);
}

.password-icon {
  background: var(--grey-icon-bg);
  color: var(--toast-info);
}

.notification-icon {
  background: var(--green-bg);
  color: var(--green);
}

.notification-header-content {
  min-width: 0;
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

.notification-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  color: var(--grey);
  font-size: 12px;
  line-height: 1.5;
}

.notification-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notification-label {
  font-size: 16px;
  font-weight: 600;
}

.notification-description {
  margin-top: 4px;
  color: var(--grey);
  font-size: 13px;
}

.notification-separator {
  margin: 20px 0;
}

.schedule-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-label {
  font-size: 15px;
  font-weight: 600;
}

.days-selector {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
}

.day-btn {
  min-width: 0;
  min-height: 40px;
  padding: 0 2px;
  border-radius: 10px;
  font-size: 12px;
}

.timezone-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--grey);
  font-size: 12px;
}

.next-reminder {
  color: var(--green);
}

.schedule-btn {
  width: 100%;
  height: 52px;
  border-radius: 16px;
  margin-top: 4px;
}

.notification-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: var(--grey-icon-bg);
  color: var(--toast-info);
  font-size: 13px;
  line-height: 1.5;
}

.permission-warning {
  margin-top: 16px;
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

  .days-selector {
    gap: 4px;
  }

  .day-btn {
    font-size: 11px;
  }
}
</style>
