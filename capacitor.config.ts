import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  // Ідентифікатор пакета — постійний після першої публікації в сторах.
  appId: "com.healthfit.app",
  appName: "Health Fit",

  // Capacitor кладе у нативний проєкт вміст цієї теки. `nuxt generate` у
  // SPA-режимі (`ssr: false`) збирає статику саме сюди.
  webDir: ".output/public",

  server: {
    // Походження всередині WebView: https://localhost на Android і
    // capacitor://localhost на iOS. Від нього залежать redirect URL для
    // Supabase-авторизації (етап 3) і allowlist у налаштуваннях проєкту.
    androidScheme: "https",
    iosScheme: "capacitor",
  },
};

export default config;
