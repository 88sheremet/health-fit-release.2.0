import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:created', () => {
    nuxtApp.$pinia.use(piniaPluginPersistedstate)
  })
})