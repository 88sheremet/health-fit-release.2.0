import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Ідентифікатор пакета — постійний після першої публікації в сторах.
  appId: "com.healthfit.app",
  appName: "Health Fit",

  // Capacitor кладе у нативний проєкт вміст цієї теки. `nuxt generate` у
  // SPA-режимі (`ssr: false`) збирає статику саме сюди.
  webDir: ".output/public",

  plugins: {
    SplashScreen: {
      // Без цього нативна заставка зникає, щойно з'явиться вікно застосунку,
      // а WebView до того моменту ще не встиг нічого намалювати — користувач
      // бачить білий екран. Ховаємо заставку вручну з app/plugins, коли
      // перша сторінка вже відрендерилась.
      launchAutoHide: false,
      backgroundColor: "#ffffff",
      showSpinner: false,
    },
  },

  server: {
    // Походження всередині WebView: https://localhost на Android і
    // capacitor://localhost на iOS. Від нього залежать redirect URL для
    // Supabase-авторизації (етап 3) і allowlist у налаштуваннях проєкту.
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
