/*
 * ============================================================
 * IMPORTS
 * ============================================================
 *
 * routes используется для построения redirectTo и для выбора целевой
 * страницы после завершения Google OAuth.
 */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 *
 * GOOGLE_CALLBACK_PATH — путь, по которому Supabase вернёт браузер
 * после завершения OAuth-флоу Google (его обрабатывает страница
 * /auth/callback). Именно сюда приходит ?code из PKCE-флоу.
 *
 * GoogleAuthDestination — тип результата функции getGoogleAuthDestination:
 * перечисляет все разрешённые целевые маршруты после входа через Google.
 */
export type GoogleAuthDestination =
  | typeof routes.auth.login
  | typeof routes.recovery.daily
  | typeof routes.onboarding.welcome;

export const GOOGLE_CALLBACK_PATH = "/auth/callback";

/*
 * ============================================================
 * PUBLIC API
 * ============================================================
 *
 * Функции, которые используют страницы приложения для входа через
 * Google. Вызываются только из Nuxt-контекста (страницы/компоненты),
 * поскольку полагаются на useSupabaseClient.
 */

/*
 * Запускает вход через Google: отправляет пользователя на страницу
 * выбора аккаунта Google.
 *
 * Вызывается из app/pages/login.vue (кнопка «Войти через Google»).
 *
 * Шаги:
 *  1. Получаем клиент Supabase (useSupabaseClient доступен только
 *     в Nuxt-контексте, поэтому сервис вызывается из компонента).
 *  2. Строим redirectTo: текущий origin + /auth/callback — именно сюда
 *     Google вернёт пользователя с одноразовым кодом (PKCE).
 *  3. Вызываем signInWithOAuth: сам редирект выполняет Supabase.
 *  4. При ошибке пробрасываем её наверх — login.vue покажет сообщение.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = useSupabaseClient();

  // redirectTo всегда указывает на обрабатывающий адрес приложения:
  // по нему Supabase вернёт браузер после выбора аккаунта Google.
  const redirectTo = `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;

  // Сам редирект выполняет Supabase; здесь только проверяем, что
  // запуск OAuth прошёл без ошибок конфигурации.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    // Пробрасываем ошибку вызывающему коду (login.vue): именно он
    // отвечает за отображение сообщения пользователю.
    throw error;
  }
}

/*
 * Определяет, куда направить пользователя после возврата из Google OAuth.
 *
 * Вызывается из /auth/callback — здесь лежит финальный шаг PKCE-флоу:
 * Google вернул одноразовый код, который обменивается на сессию.
 *
 * Шаги:
 *  1. Если передан строковый код — обмениваем его на сессию через
 *     exchangeCodeForSession (PKCE).
 *  2. Ошибка обмена = код протух/недействителен — возвращаем /login.
 *  3. Читаем текущую сессию; если сессии или юзера нет — /login.
 *  4. Проверяем, прошёл ли юзер скрининг (screening_results).
 *  5. Скрининг есть — /daily (главный экран), иначе /welcome
 *     (вход в онбординг со скринингом).
 */
export async function getGoogleAuthDestination(
  code?: unknown
): Promise<GoogleAuthDestination> {
  const supabase = useSupabaseClient();

  // Код приходит параметром ?code в URL редиректа от Supabase (PKCE)
  // и существует только при свежем входе. Обмениваем его на сессию
  // лишь тогда, когда он действительно передан.
  if (typeof code === "string" && code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
      code
    );

    if (exchangeError) {
      // Неудачный обмен означает, что сессия так и не создана, —
      // возвращаем на страницу входа.
      return routes.auth.login;
    }
  }

  // Сессия — источник истины о том, что OAuth завершился успешно.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    // Сессии нет или она не читается — значит, вход не состоялся,
    // и пускать пользователя в закрытую часть приложения нельзя.
    return routes.auth.login;
  }

  const user = session.user;

  // Проверяем наличие записи скрининга: именно она определяет,
  // куда вести пользователя дальше по приложению.
  const { data: screeningResult, error: screeningError } = await supabase
    .from("screening_results")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (screeningError) {
    // Ошибка проверки скрининга: решаем безопасно в пользу страницы
    // входа, чтобы не увести пользователя вслепую.
    return routes.auth.login;
  }

  if (screeningResult) {
    // Скрининг уже пройден — пользователь в основном функционале,
    // отправляем его сразу на главный экран /daily.
    return routes.recovery.daily;
  }

  // Скрининга ещё нет — новичок начинает с онбординга (/welcome).
  return routes.onboarding.welcome;
}
