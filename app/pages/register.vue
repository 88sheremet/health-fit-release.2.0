<template>  <!--
    Страница регистрации нового пользователя: создание аккаунта
    по email и паролю либо через OAuth Google.
  -->
  <div class="register-page">
    <div class="register-card">
      <!--
        Заголовок страницы: текст зависит от языка приложения
        ($t — перевод по словарю i18n: "Регистрация" / "Реєстрація").
      -->
      <h1>{{ $t("auth.registerTitle") }}</h1>

      <!--
        Поле email: значение идёт в валидацию и в supabase.auth.signUp.
        Отключается, если идёт регистрация (loading) или Google-вход
        (googleLoading).
      -->
      <q-input
        v-model="email"
        :label="$t('auth.email')"
        type="email"
        outlined
        autocomplete="email"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!--
        Поле пароля: проверяется на обязательность и минимальную
        длину (6 символов), после чего уходит в запрос signUp.
      -->
      <q-input
        v-model="password"
        :label="$t('auth.password')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!--
        Повторный ввод пароля: сверяется с полем password через
        matchesField; при расхождении выводится ошибка mismatch.
      -->
      <q-input
        v-model="confirmPassword"
        :label="$t('auth.confirmPassword')"
        type="password"
        outlined
        autocomplete="new-password"
        class="q-mb-md"
        :disable="loading || googleLoading"
      />

      <!--
        Блок ошибки формы: виден, когда errorMessage не пуст
        (ошибка валидации или ответа Supabase).
      -->
      <div v-if="errorMessage" class="register-error">
        {{ errorMessage }}
      </div>

      <!--
        Блок успешного сообщения: появляется, когда регистрация
        выполнена, но сессия не создана (нужно подтвердить email).
      -->
      <div v-if="successMessage" class="register-success">
        {{ successMessage }}
      </div>

      <!--
        Кнопка регистрации по email: запускает register().
        Показывает индикатор загрузки во время запроса.
      -->
      <q-btn
        :label="$t('auth.registerBtn')"
        color="primary"
        unelevated
        class="full-width"
        :loading="loading"
        :disable="googleLoading"
        @click="register"
      />

      <!--
        Разделитель между email-регистрацией и входом через Google.
        Текст "$t('auth.or')" переводится ("или" / "або").
      -->
      <div class="oauth-divider">
        <span>{{ $t("auth.or") }}</span>
      </div>

      <!--
        Кнопка регистрации через Google: вызывает registerWithGoogle().
        При загрузке показывается спиннер вместо логотипа "G".
      -->
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

      <!--
        Ссылка на страницу входа через централизованный маршрут
        routes.auth.login (вместо жёстко прописанного "/login").
      -->
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
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Централизованный маршрут-объект: используем его при навигации
 * вместо жёстко прописанных URL-строк.
 */
import { routes } from "~/router/routes";

/*
 * Сервис Google OAuth: открывает окно провайдера и возвращает
 * управление на страницу /auth/callback.
 */
import { signInWithGoogle } from "~/services/googleAuth.service";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * Middleware "guest": страница доступна только неавторизованным
 * пользователям; авторизованных перенаправляет в приложение.
 */
definePageMeta({
  middleware: "guest",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Клиент Supabase: выполняет регистрацию (auth.signUp).
 */
const supabase = useSupabaseClient();

/*
 * Роутер Nuxt: программный переход в онбординг после регистрации.
 */
const router = useRouter();

/*
 * Функция перевода vue-i18n; все сообщения формы зависят от локали.
 */
const { t } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/*
 * email: значение поля; уходит в signUp (после обрезки пробелов).
 */
const email = ref("");

/*
 * password: значение поля; проверяется валидатором и уходит в signUp.
 */
const password = ref("");

/*
 * confirmPassword: повторный ввод пароля; нужен только для проверки
 * совпадения с полем password.
 */
const confirmPassword = ref("");

/*
 * loading: true — идёт email-регистрация; кнопка регистрации
 * блокируется и показывает индикатор загрузки.
 */
const loading = ref(false);

/*
 * googleLoading: true — идёт Google-авторизация; форма блокируется,
 * а на Google-кнопке показывается индикатор.
 */
const googleLoading = ref(false);

/*
 * errorMessage: не пустая строка — показывается блок .register-error
 * с текстом ошибки (валидация или ответ Supabase).
 */
const errorMessage = ref("");

/*
 * successMessage: не пустая строка — показывается блок
 * .register-success (например, требование подтвердить email).
 */
const successMessage = ref("");

/*
 * ============================================================
 * VALIDATION
 * ============================================================
 */

/*
 * Валидатор email: поле обязательно и должно быть валидным email.
 * Сообщения об ошибках берутся из словаря i18n ($t).
 */
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

/*
 * Валидатор пароля: обязателен и не короче 6 символов
 * (сообщение о минимуме переводится через $t).
 */
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

/*
 * ============================================================
 * REGISTER FLOW
 * ============================================================
 */

/*
 * Регистрация нового пользователя по email и паролю.
 *
 * Поток:
 * 1. Сброс сообщений об ошибке и об успехе.
 * 2. Валидация полей: email, пароль, подтверждение и его совпадение.
 * 3. При ошибке валидации — показ её текста на экране и выход.
 * 4. Включение индикатора загрузки на кнопке.
 * 5. Вызов supabase.auth.signUp с обрезанным по краям email.
 * 6. Обработка ошибки Supabase; если сессия создана сразу —
 *    переход в онбординг, иначе — сообщение о подтверждении email.
 * 7. finally — возврат формы в активное состояние.
 */
const register = async () => {
  // Сбрасываем сообщения прошлого запроса.
  errorMessage.value = "";
  successMessage.value = "";

  // Валидация полей: возвращается текст первой найденной ошибки.
  const validationError = validateForm(
    validateEmail(email.value),
    validatePassword(password.value),
    !isRequired(confirmPassword.value) ? t("auth.fillAllFields") : null,
    !matchesField(password.value)(confirmPassword.value)
      ? t("auth.passwordMismatch")
      : null
  );

  // Валидация не пройдена — показываем ошибку и останавливаемся.
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  // Блокируем форму на время запроса к Supabase.
  loading.value = true;

  try {
    // Запрос на создание пользователя (email обрезаем по краям).
    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
    });

    // Ошибка со стороны Supabase — выводим её сообщение.
    if (error) {
      console.error("[Auth] Registration error:", error);

      errorMessage.value = error.message;
      return;
    }

    // Сессия создана сразу — email подтверждён: идём в онбординг.
    if (data.session) {
      console.log("[Auth] Registration successful → Welcome");

      await router.replace(routes.onboarding.welcome);
      return;
    }

    // Сессии нет — требуется подтверждение email: показываем подсказку.
    successMessage.value = t("auth.registerSuccess");
  } catch (error) {
    // Неожиданная ошибка — общее сообщение вместо падения страницы.
    console.error("[Auth] Registration unexpected error:", error);

    errorMessage.value = t("auth.registerError");
  } finally {
    // Сообщение обработано: разблокируем форму.
    loading.value = false;
  }
};

/*
 * Регистрация/вход через Google OAuth: окно провайдера открывает
 * сервис, а обработку результата выполняет страница /auth/callback.
 *
 * Поток:
 * 1. Сброс сообщений формы.
 * 2. Включение индикатора загрузки на Google-кнопке.
 * 3. Вызов signInWithGoogle (инициирует OAuth-поток).
 * 4. При ошибке — показ её сообщения и сброс индикатора вручную
 *    (finally здесь не используется).
 */
const registerWithGoogle = async () => {
  errorMessage.value = "";
  successMessage.value = "";

  // Блокируем форму на время открытия окна провайдера.
  googleLoading.value = true;

  try {
    // Инициируем OAuth-поток Google.
    await signInWithGoogle();
  } catch (error) {
    // Показываем текст ошибки (приоритет — сообщение из исключения).
    console.error("[Auth] Google registration error:", error);

    errorMessage.value =
      error instanceof Error ? error.message : t("auth.registerError");
    // Снимаем блокировку вручную — finally в этом обработчике отсутствует.
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
  color: var(--google-blue);
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
