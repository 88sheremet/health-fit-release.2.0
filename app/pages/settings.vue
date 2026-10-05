<template>  <!--
    Экран настроек: смена языка интерфейса (i18n),
    смена пароля (с повторной авторизацией) и
    нижняя навигация с кнопкой выхода.
  -->
  <div class="page">
    <!--
      Шапка с кнопкой «назад» и заголовком раздела.
    -->
    <div class="header">
      <!--
        Кнопка возврата: история браузера > 1 — router.back(),
        иначе fallback в меню (routes.recovery.menu).
      -->
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        class="back-btn"
        @click="goBack"
      />

      <!--
        Заголовок и подзаголовок экрана настроек.
      -->
      <div>
        <!--
          Заголовок раздела (ключ settings.title, $t локализован).
        -->
        <div class="title">
          {{ $t("settings.title") }}
        </div>

        <!--
          Подзаголовок-описание раздела настроек.
        -->
        <div class="subtitle">
          {{ $t("settings.subtitle") }}
        </div>
      </div>
    </div>

    <!--
      Карточка языка: переключает локаль i18n. Влияет на все
      переводы приложения, включая тексты задач план-модулей.
    -->
    <q-card class="settings-card">
      <!--
        Иконка + заголовки карточки языка.
      -->
      <div class="card-header">
        <!--
          Плашка с иконкой глобуса (язык интерфейса).
        -->
        <div class="icon-wrapper language-icon">
          <q-icon name="language" size="26px" />
        </div>

        <!--
          Название и пояснение секции языка.
        -->
        <div>
          <!--
            Заголовок секции (settings.language.title).
          -->
          <div class="card-title">
            {{ $t("settings.language.title") }}
          </div>

          <!--
            Пояснение секции (settings.language.subtitle).
          -->
          <div class="card-subtitle">
            {{ $t("settings.language.subtitle") }}
          </div>
        </div>
      </div>

      <!--
        Селектор локали: emit-value + map-options отдают код
        ("ru"/"uk"); изменение вызывает changeLanguage,
        который зовёт setLocale() и обновляет selectedLocale.
      -->
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

    <!--
      Карточка смены пароля: три поля,
      кнопка смены и повторная авторизация текущего пароля.
    -->
    <q-card class="settings-card">
      <!--
        Иконка + заголовки карточки пароля.
      -->
      <div class="card-header">
        <!--
          Плашка с иконкой замка (безопасность аккаунта).
        -->
        <div class="icon-wrapper password-icon">
          <q-icon name="lock" size="26px" />
        </div>

        <!--
          Название и пояснение секции пароля.
        -->
        <div>
          <!--
            Заголовок секции (settings.password.title).
          -->
          <div class="card-title">
            {{ $t("settings.password.title") }}
          </div>

          <!--
            Пояснение секции (settings.password.subtitle).
          -->
          <div class="card-subtitle">
            {{ $t("settings.password.subtitle") }}
          </div>
        </div>
      </div>

      <!--
        Поля формы смены пароля: текущий пароль, новый
        и подтверждение; ошибки выводятся под полями.
      -->
      <div class="password-fields">
        <!--
          Текущий пароль: нужен для повторной авторизации
          через signInWithPassword перед обновлением.
        -->
        <q-input
          v-model="currentPassword"
          outlined
          type="password"
          :label="$t('settings.password.currentPassword')"
          autocomplete="current-password"
          :error="!!currentPasswordError"
          :error-message="currentPasswordError"
        />

        <!--
          Новый пароль: минимум 6 символов (minLength),
          видимость переключается иконкой глаза.
        -->
        <q-input
          v-model="newPassword"
          outlined
          :type="showPassword ? 'text' : 'password'"
          :label="$t('settings.password.newPassword')"
          autocomplete="new-password"
          :error="!!passwordError"
          :error-message="passwordError"
        >
          <!--
            Кнопка-глаз: переключает showPassword,
            чтобы показать/скрыть вводимый пароль.
          -->
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <!--
          Подтверждение нового пароля: сравнивается
          с newPassword (matchesField), иначе passwordMismatch.
        -->
        <q-input
          v-model="confirmPassword"
          outlined
          :type="showConfirmPassword ? 'text' : 'password'"
          :label="$t('settings.password.confirmPassword')"
          autocomplete="new-password"
          :error="!!confirmPasswordError"
          :error-message="confirmPasswordError"
        >
          <!--
            Кнопка-глаз: переключает showConfirmPassword.
          -->
          <template #append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </q-input>

        <!--
          Кнопка «Сменить пароль»: на время выполнения
          показана в loading-состоянии (disable на время запроса).
        -->
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
    <!--
      Кнопка выхода из аккаунта (переиспользуется на экранах).
    -->
    <LogoutButton />

    <!--
      Нижняя навигация daily / weekly / journal.
    -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * computed — список вариантов локалей; ref — поля формы,
 * флаги видимости и состояние загрузки.
 */
import { computed, ref } from "vue";

/*
 * Компонент кнопки выхода из аккаунта (LogoutButton).
 */
import LogoutButton from "~/components/auth/LogoutButton.vue";

/*
 * Централизованная система маршрутов: fallback-переход
 * goBack() на routes.recovery.menu.
 */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 *
 * middleware: "auth" — доступ только для авторизованных
 * (иначе редирект на вход).
 * layout: "authenticated" — шапка с логотипом и кнопками.
 */
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Роутер: нужен для router.back() / router.push() в goBack().
 */
const router = useRouter();

/*
 * Клиент Supabase: повторная авторизация (signInWithPassword),
 * смена пароля (updateUser) и выход других сессий (signOut).
 */
const supabase = useSupabaseClient();

/*
 * Quasar-объект: $q.notify показывает успешную смену пароля.
 */
const $q = useQuasar();

/*
 * i18n: locale — текущая локаль; locales — список доступных;
 * setLocale — переключение языка; t — перевод сообщений.
 * Смена locale влияет на все $t/{{ t }} приложения,
 * включая переводы задач.
 */
const { locale, locales, setLocale, t } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/*
 * Поля формы смены пароля (реактивные значения ввода).
 */
const newPassword = ref("");
const confirmPassword = ref("");
const currentPassword = ref("");

/*
 * Флаги видимости паролей: показывают/скрывают текст
 * в полях через type="text" / type="password".
 */
const showPassword = ref(false);
const showConfirmPassword = ref(false);

/*
 * true — пока идёт запрос смены пароля (кнопка в spinner).
 */
const loading = ref(false);

/*
 * Выбранная локаль текущего пользователя; синхронизируется
 * с locale.value на старте (значение по умолчанию).
 */
const selectedLocale = ref(locale.value);

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/*
 * Список вариантов для q-select: label — название языка
 * (item.name из конфигурации i18n), value — код локали
 * ("ru" / "uk"). Пересчёт при изменении locales.
 */
const localeOptions = computed(() =>
  locales.value.map((item) => ({
    label: item.name,
    value: item.code,
  }))
);

/*
 * Тексты ошибок полей формы: выводятся под q-input
 * через :error / :error-message.
 */
const passwordError = ref("");
const confirmPasswordError = ref("");
const currentPasswordError = ref("");

/*
 * Валидатор текущего пароля: обязательное поле.
 * ВАЖНО: сообщение t() фиксируется при создании валидатора
 * (на этапе setup), т.е. привязка к локали — статичная.
 */
const validateCurrentPassword = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
]);

/*
 * Валидатор нового пароля: обязательное поле +
 * минимальная длина 6 символов (minLength).
 */
const validateNewPassword = createValidator([
  { check: isRequired, message: t("auth.fillAllFields") },
  { check: minLength(6), message: t("auth.minPassword") },
]);

/*
 * ============================================================
 * METHODS / FUNCTIONS
 * ============================================================
 */

/*
 * Возврат на предыдущий экран.
 *
 * 1. window.history.length > 1 → возвращаемся по истории
 *    браузера (router.back()).
 * 2. Иначе (нет истории) → push на routes.recovery.menu
 *    через централизованный маршрут.
 */
function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push(routes.recovery.menu);
  }
}

/*
 * ============================================================
 * CHANGE LOCALE FLOW
 * ============================================================
 */

/*
 * Переключение языка интерфейса.
 *
 * 1. Принимает код локали ("ru" | "uk") от q-select.
 * 2. setLocale(value) — переключение i18n в runtime,
 *    после чего все $t / t() и переводы задач обновляются.
 * 3. selectedLocale синхронизируется с новым значением.
 */
async function changeLanguage(value: "ru" | "uk") {
  await setLocale(value);
  selectedLocale.value = value;
}

/*
 * ============================================================
 * PASSWORD CHANGE FLOW
 * ============================================================
 */

/*
 * Смена пароля с повторной авторизацией.
 *
 * 1. Сбрасываем тексты ошибок всех полей.
 * 2. Валидируем текущий пароль (isRequired).
 * 3. Валидируем новый пароль (required + minLength 6).
 * 4. Сверяем подтверждение (matchesField) → passwordMismatch.
 * 5. loading = true — блокируем кнопку на время запросов.
 * 6. getUser() → email текущего пользователя.
 * 7. signInWithPassword() — повторная авторизация текущим
 *    паролем; ошибка → wrongPassword.
 * 8. updateUser({ password }) — собственно смена пароля.
 * 9. signOut({ scope: "others" }) — разлогин сессий
 *    на других устройствах.
 * 10. Чистим поля формы и показываем $q.notify (success).
 * 11. finally: loading = false.
 */
async function changePassword() {
  passwordError.value = "";
  confirmPasswordError.value = "";
  currentPasswordError.value = "";

  /* Валидация текущего пароля: заполнен ли он. */
  const curError = validateCurrentPassword(currentPassword.value);
  if (curError) {
    currentPasswordError.value = curError;
    return;
  }

  /* Валидация нового пароля: заполнен и длина >= 6. */
  const pwError = validateNewPassword(newPassword.value);
  if (pwError) {
    passwordError.value = pwError;
    return;
  }

  /* Сверка нового пароля и его подтверждения. */
  if (!matchesField(newPassword.value)(confirmPassword.value)) {
    confirmPasswordError.value = t("auth.passwordMismatch");
    return;
  }

  loading.value = true;

  try {
    /*
     * Берём email из текущей сессии — он нужен
     * для повторной авторизации.
     */
    const { data: user } = await supabase.auth.getUser();
    const email = user.user?.email;

    /*
     * Email отсутствует — показываем общую ошибку.
     */
    if (!email) {
      passwordError.value = t("settings.password.error");
      return;
    }

    /*
     * Повторная авторизация: убеждаемся, что пользователь
     * знает текущий пароль (защита от подмены).
     */
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword.value,
    });

    /*
     * Неверный текущий пароль — подсвечиваем поле.
     */
    if (authError) {
      currentPasswordError.value = t("settings.password.wrongPassword");
      return;
    }

    /*
     * Смена пароля у текущего пользователя в Supabase.
     */
    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    });

    /*
     * Ошибка обновления — блокируем общей ошибкой.
     */
    if (error) {
      passwordError.value = t("settings.password.error");
      return;
    }

    /*
     * Выход на других устройствах: пароль сменился,
     * посторонние сессии должны переавторизоваться.
     */
    await supabase.auth.signOut({ scope: "others" });

    /* Очистка полей формы после успешной смены. */
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";

    /*
     * Уведомление об успешной смене пароля (локализовано).
     */
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
