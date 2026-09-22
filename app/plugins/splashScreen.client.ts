import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";

/**
 * Ховає нативну заставку, коли перша сторінка вже намальована.
 *
 * У конфізі Capacitor стоїть `launchAutoHide: false`, інакше заставка зникає
 * разом із появою вікна застосунку — тобто раніше, ніж WebView встигне щось
 * відрендерити, і між ними видно білий екран.
 */
export default defineNuxtPlugin((nuxtApp) => {
  if (!Capacitor.isNativePlatform()) return;

  let hidden = false;

  const hide = () => {
    if (hidden) return;
    hidden = true;
    // Помилку глушимо свідомо: заставка — не той випадок, коли варто валити
    // старт застосунку.
    SplashScreen.hide().catch(() => {});
  };

  // Страхувальний таймер. Якщо рендер першої сторінки впаде, заставка не має
  // лишитись на екрані назавжди — навіть екран з помилкою кращий за застиглий
  // логотип.
  const failsafe = setTimeout(hide, 5000);

  nuxtApp.hook("app:suspense:resolve", () => {
    clearTimeout(failsafe);
    hide();
  });
});
