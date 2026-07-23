export default defineNuxtConfig({
  compatibilityDate: "2026-07-22",

  modules: ["@pinia/nuxt"],

  css: [
    "~/assets/colors.css",
    "~/assets/style.css",
  ],

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

  devtools: { enabled: true },
});
