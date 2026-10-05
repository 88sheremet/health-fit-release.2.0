<template>  <!--
    Основной контейнер страницы авторизации.
    Центрирует карточку логина по горизонтали и вертикали.
  -->
  <div class="login-page">
    <!--
      Карточка авторизации.
      Ограничена максимальной шириной 400px.
    -->
    <div class="login-card">
      <!--
        Заголовок страницы.
        Текст берётся из i18n, поэтому зависит от выбранной локали.
        Например: "Вхід" / "Вход".
      -->
      <h1>{{ $t("auth.loginTitle") }}</h1>

      <!--
        Форма авторизации через email + password.


        @submit.prevent:
        - перехватывает стандартную отправку HTML-формы;
        - предотвращает перезагрузку страницы;
        - вызывает функцию login().
      -->
      <form @submit.prevent="login">
        <!--
          Поле email.


          v-model="email":
          связывает input с реактивной переменной email.


          type="email":
          указывает браузеру, что поле предназначено для email.


          :disable:
          блокирует поле во время любого процесса авторизации:
          - обычного login;
          - Google login.
        -->
        <q-input
          v-model="email"
          :label="$t('auth.email')"
          type="email"
          outlined
          class="q-mb-md"
          :disable="loading || googleLoading"
        />

        <!--
          Поле пароля.


          v-model="password":
          связывает input с реактивной переменной password.


          type="password":
          скрывает введённый пароль.


          Поле блокируется во время авторизации.
        -->
        <q-input
          v-model="password"
          :label="$t('auth.password')"
          type="password"
          outlined
          class="q-mb-md"
          :disable="loading || googleLoading"
        />

        <!--
          Сообщение об ошибке.


          Отображается только если errorMessage содержит значение.
          Например:
          - ошибка валидации;
          - неверный email/password;
          - ошибка Supabase;
          - ошибка проверки screening.
        -->
        <div v-if="errorMessage" class="login-error">
          {{ errorMessage }}
        </div>

        <!--
          Основная кнопка авторизации через email/password.


          type="submit":
          отправляет форму и вызывает login().


          :loading:
          показывает loader во время запроса к Supabase.


          :disable:
          блокирует кнопку, если выполняется Google login.
        -->
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

      <!--
        Визуальный разделитель между обычной авторизацией
        и авторизацией через Google.
      -->
      <div class="oauth-divider">
        <span>{{ $t("auth.loginTitle") }} {{ $t("auth.or") }}</span>
      </div>

      <!--
        Кнопка авторизации через Google.


        @click:
        запускает loginWithGoogle().


        :loading:
        показывает loader во время Google OAuth.


        :disable:
        блокирует кнопку, если выполняется обычный login.
      -->
      <q-btn
        unelevated
        no-caps
        class="google-btn full-width"
        :loading="googleLoading"
        :disable="loading"
        @click="loginWithGoogle"
      >
        <!--
          Содержимое Google-кнопки.


          При обычном состоянии показывается буква "G".
          Во время loading Quasar вместо неё показывает loader.
        -->
        <template #default>
          <!--
            Упрощённая иконка Google.
            Скрывается во время загрузки.
          -->
          <span v-if="!googleLoading" class="google-icon"> G </span>

          <!--
            Локализованный текст кнопки Google login.
          -->
          <span class="google-text">
            {{ $t("auth.googleLogin") }}
          </span>
        </template>
      </q-btn>

      <!--
        Ссылки на другие страницы авторизации.
      -->
      <div class="login-links">
        <!--
          Переход на страницу регистрации.


          routes.auth.register:
          централизованный URL маршрута регистрации.
        -->
        <NuxtLink :to="routes.auth.register">
          {{ $t("auth.registerLink") }}
        </NuxtLink>

        <!--
          Переход на страницу восстановления пароля.
        -->
        <NuxtLink :to="routes.auth.forgotPassword">
          {{ $t("auth.forgotPassword") }}
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
 * Централизованная система маршрутов приложения.
 *
 * Вместо хардкода:
 *   "/register"
 *   "/forgot-password"
 *   "/daily"
 *
 * используются:
 *   routes.auth.register
 *   routes.auth.forgotPassword
 *   routes.recovery.daily
 *
 * Это позволяет хранить URL в одном месте.
 */
import { routes } from "~/router/routes";


/*
 * Сервис Google OAuth.
 *
 * Реализация Google авторизации вынесена из компонента
 * в отдельный service.
 *
 * login.vue отвечает за UI и auth-flow,
 * а googleAuth.service.ts — непосредственно за Google OAuth.
 */
import { signInWithGoogle } from "~/services/googleAuth.service";




/*
 * ============================================================
 * PAGE META
 * ============================================================
 */


/*
 * guest middleware.


 * Эта страница предназначена для неавторизованных пользователей.
 *
 * Если пользователь уже имеет активную Supabase session,
 * middleware может перенаправить его с /login.
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
 * Supabase client.


 * Используется для:
 *
 * 1. Авторизации:
 *    supabase.auth.signInWithPassword()
 *
 * 2. Проверки screening:
 *    supabase.from("screening_results")
 */
const supabase = useSupabaseClient();


/*
 * Nuxt Router.


 * Используется для программного перехода
 * после успешной авторизации.
 */
const router = useRouter();


/*
 * i18n.


 * Функция t() используется внутри JavaScript-кода
 * для получения локализованных сообщений.
 */
const { t } = useI18n();




/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */


/*
 * Email пользователя.
 *
 * Связан с email input через v-model.
 */
const email = ref("");


/*
 * Пароль пользователя.
 *
 * Связан с password input через v-model.
 */
const password = ref("");


/*
 * Состояние обычной авторизации.


 * true:
 *   выполняется email/password login.


 * false:
 *   обычный login не выполняется.
 *
 * Используется для:
 * - loader на Login button;
 * - блокировки input;
 * - блокировки Google button.
 */
const loading = ref(false);


/*
 * Состояние Google авторизации.


 * true:
 *   выполняется Google OAuth.


 * false:
 *   Google login не выполняется.
 *
 * Используется для:
 * - loader на Google button;
 * - блокировки input;
 * - блокировки обычного Login button.
 */
const googleLoading = ref(false);


/*
 * Сообщение об ошибке.


 * Может содержать:
 * - ошибку валидации;
 * - ошибку Supabase Auth;
 * - ошибку Database;
 * - ошибку Google OAuth.
 */
const errorMessage = ref("");




/*
 * ============================================================
 * VALIDATION
 * ============================================================
 */


/*
 * Создаём валидатор для email.


 * Проверяется две вещи:


 * 1. isRequired
 *    Email должен быть заполнен.


 * 2. isEmail
 *    Email должен иметь корректный формат.


 * createValidator() и сами validators являются
 * переиспользуемой системой валидации приложения.
 */
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




/*
 * ============================================================
 * EMAIL / PASSWORD LOGIN
 * ============================================================
 */


/*
 * Основная функция авторизации через email/password.


 * Общий flow:


 * 1. Очистить старую ошибку.
 * 2. Проверить email и password.
 * 3. Включить loading.
 * 4. Отправить credentials в Supabase Auth.
 * 5. Получить пользователя.
 * 6. Проверить, проходил ли пользователь screening.
 * 7. Перенаправить:
 *      - /daily, если screening уже есть;
 *      - /welcome, если screening ещё нет.
 */
const login = async () => {
  /*
   * Очищаем ошибку предыдущей попытки входа.
   */
  errorMessage.value = "";

  /*
   * Выполняем валидацию формы.


   * Email проверяется через validateEmail().


   * Password проверяется через isRequired().
   */
  const validationError = validateForm(
    validateEmail(email.value),
    !isRequired(password.value) ? t("auth.loginError") : null
  );

  /*
   * Если форма невалидна:
   *
   * 1. Показываем ошибку пользователю.
   * 2. Прерываем выполнение login().
   *
   * Запрос в Supabase в этом случае не выполняется.
   */
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }

  /*
   * Включаем состояние загрузки.


   * UI:
   * - Login button показывает loader;
   * - email/password inputs блокируются;
   * - Google button блокируется.
   */
  loading.value = true;

  try {
    /*
     * Авторизация через Supabase Auth.


     * Передаём:
     * - email пользователя;
     * - password пользователя.
     */
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    /*
     * Если Supabase вернул ошибку авторизации:
     *
     * например:
     * "Invalid login credentials"
     *
     * показываем её пользователю
     * и прекращаем дальнейшее выполнение.
     */
    if (error) {
      errorMessage.value = error.message;
      return;
    }

    /*
     * Получаем авторизованного пользователя.
     */
    const user = data.user;

    /*
     * Дополнительная защита.


     * Даже если Supabase не вернул error,
     * user должен существовать для продолжения auth-flow.
     */
    if (!user) {
      errorMessage.value = t("auth.loginError");
      return;
    }

    /*
     * Пользователь успешно авторизован.


     * Теперь определяем, проходил ли он screening.
     *
     * user.id используется для поиска записи
     * в таблице screening_results.
     */
    await redirectAfterLogin(user.id);
  } catch (error) {
    /*
     * Обрабатываем непредвиденную ошибку,
     * которая могла возникнуть во время login-flow.
     */
    console.error("[Auth] Login error:", error);

    /*
     * Показываем пользователю общее сообщение ошибки.
     */
    errorMessage.value = t("auth.loginError");
  } finally {
    /*
     * finally выполняется независимо от результата:
     * success / error / return / exception.


     * Поэтому loading всегда возвращается в false.
     */
    loading.value = false;
  }
};




/*
 * ============================================================
 * GOOGLE LOGIN
 * ============================================================
 */


/*
 * Авторизация через Google.


 * В отличие от обычного login,
 * здесь OAuth-flow вынесен в отдельный service:
 *
 * login.vue
 *    ↓
 * loginWithGoogle()
 *    ↓
 * signInWithGoogle()
 *    ↓
 * Google
 *    ↓
 * Supabase
 *    ↓
 * /auth/callback
 */
const loginWithGoogle = async () => {
  /*
   * Очищаем ошибку предыдущей попытки.
   */
  errorMessage.value = "";

  /*
   * Включаем состояние Google loading.


   * UI:
   * - Google button показывает loader;
   * - обычный login блокируется;
   * - input блокируются.
   */
  googleLoading.value = true;

  try {
    /*
     * Запускаем Google OAuth.


     * Сам OAuth-flow реализован в:
     * services/googleAuth.service.ts
     */
    await signInWithGoogle();
  } catch (error) {
    /*
     * Логируем ошибку Google OAuth.
     */
    console.error("[Auth] Google login error:", error);

    /*
     * Если ошибка является стандартным Error,
     * показываем её сообщение.


     * Иначе используем локализованное
     * общее сообщение ошибки.
     */
    errorMessage.value =
      error instanceof Error ? error.message : t("auth.loginError");

    /*
     * Возвращаем Google loading в false.


     * При успешном OAuth этот компонент может
     * покинуть страницу через redirect,
     * поэтому в success-flow это значение уже не критично.
     */
    googleLoading.value = false;
  }
};




/*
 * ============================================================
 * REDIRECT AFTER LOGIN
 * ============================================================
 */


/*
 * Определяет, куда отправить пользователя
 * после успешного email/password login.


 * Главный критерий:
 *
 * Есть ли у пользователя запись в screening_results?
 *
 * Если есть:
 *     пользователь уже прошёл screening
 *     → /daily
 *
 * Если нет:
 *     пользователь ещё не прошёл screening
 *     → /welcome
 */
const redirectAfterLogin = async (userId: string) => {
  /*
   * Ищем результат screening конкретного пользователя.


   * Таблица:
   *     screening_results


   * Выбираем только user_id,
   * потому что остальные данные здесь не нужны.
   */
  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  /*
   * Если произошла ошибка при обращении к БД:
   *
   * 1. Логируем её.
   * 2. Показываем сообщение пользователю.
   * 3. Не выполняем redirect.
   */
  if (screeningError) {
    console.error("[Auth] Screening check error:", screeningError);

    errorMessage.value = screeningError.message;
    return;
  }

  /*
   * Если запись screening существует,
   * значит пользователь уже прошёл onboarding/screening.


   * Отправляем его непосредственно в Daily.
   *
   * replace() используется вместо push(),
   * чтобы /login не оставался отдельной записью
   * в browser history.
   */
  if (screeningResult) {
    await router.replace(routes.recovery.daily);
    return;
  }

  /*
   * Если screening_result не найден,
   * пользователь считается ещё не прошедшим screening.


   * Отправляем его на Welcome,
   * откуда начинается onboarding-flow.
   */
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
  color: var(--google-blue);
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
