export default defineNuxtConfig({
  compatibilityDate: "2026-07-22",
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
      meta: [
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, maximum-scale=1",
        },
      ],
    },
  },

  devtools: {
    enabled: true,
  },
});
