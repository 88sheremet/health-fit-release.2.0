export default defineNuxtConfig({
  compatibilityDate: "2026-07-22",

  modules: [
    "@pinia/nuxt",
   
    "pinia-plugin-persistedstate/nuxt",
  ],
  css: ["~/assets/fonts.css", "~/assets/colors.css", "~/assets/style.css"],

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

    runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  
  devtools: { enabled: true },
});
//  "@nuxtjs/supabase",