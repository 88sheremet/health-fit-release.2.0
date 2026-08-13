export default defineNuxtConfig({
  compatibilityDate: "2026-07-22",

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
