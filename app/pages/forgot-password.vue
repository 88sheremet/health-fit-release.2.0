<template>
  <div class="auth-placeholder-page">
    <div class="card">
      <h1>{{ $t("auth.forgotTitle") }}</h1>
      <p>{{ $t("auth.comingSoon") }}</p>
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="full-width"
        :label="$t('auth.backToLogin')"
        @click="navigateTo('/login')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: "guest",
});
</script>

<style scoped>
.auth-placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.card p {
  color: var(--grey);
  margin-bottom: 24px;
}
</style>
