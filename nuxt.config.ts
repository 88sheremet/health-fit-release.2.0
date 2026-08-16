export default defineNuxtConfig({
  compatibilityDate: "2026-07-22",

  // Мобільна збірка (Capacitor) вантажить статику у WebView — Node-сервера там немає.
  ssr: false,

  modules: [
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "nuxt-quasar-ui",
    "@nuxtjs/supabase",
    "@nuxtjs/i18n",
  ],

  i18n: {
    locales: [
      { code: "ru", language: "ru-RU", name: "Русский", file: "ru.json" },
      { code: "uk", language: "uk-UA", name: "Українська", file: "uk.json" },
    ],

    defaultLocale: "ru",

    strategy: "no_prefix",

    langDir: "locales",

    lazy: true,

    detectBrowserLanguage: {
      useCookie: true,

      cookieKey: "i18n_locale",

      redirectOn: "no_prefix",

      fallbackLocale: "ru",
    },
  },

  // Модуль persistedstate за замовчуванням пише стан у cookie (~4 КБ на запис,
  // сесійні — гинуть разом із процесом застосунку). Для WebView це не працює.
  piniaPluginPersistedstate: {
    storage: "localStorage",
  },

  alias: {
    cookie: "cookie-es",
  },

  nitro: {
    alias: {
      cookie: "cookie-es",
    },
  },

  css: ["~/assets/fonts.css", "~/assets/colors.css", "~/assets/style.css"],

  supabase: {
    redirect: false,

    // Без SSR cookie-сховище сесії не потрібне; до того ж лише з цим прапорцем
    // стають доступні clientOptions (PKCE та власне сховище токенів — етапи 3 і 5).
    useSsrCookies: false,
  },

  quasar: {
    plugins: ["Notify", "Dialog"],

    config: {
      brand: {
        primary: "#4caf50",
      },
    },
  },

  app: {
    head: {
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/icon?family=Material+Icons",
        },
      ],
    },
  },

  devtools: {
    enabled: true,
  },
});
