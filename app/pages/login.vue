<template>
  <div class="login-page">
    <div class="login-card">
      <h1>Вход</h1>

      <q-input
        v-model="email"
        label="Email"
        type="email"
        outlined
        class="q-mb-md"
      />

      <q-input
        v-model="password"
        label="Пароль"
        type="password"
        outlined
        class="q-mb-md"
      />

      <div v-if="errorMessage" class="login-error">
        {{ errorMessage }}
      </div>

      <q-btn
        label="Войти"
        color="primary"
        unelevated
        class="full-width"
        :loading="loading"
        @click="login"
      />

      <div class="login-links">
        <NuxtLink to="/register"> Регистрация </NuxtLink>

        <NuxtLink to="/forgot-password"> Забыли пароль? </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'guest',
})
const supabase = useSupabaseClient();
const router = useRouter();

const email = ref("");
const password = ref("");

const loading = ref(false);
const errorMessage = ref("");

const checkSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  console.log('SESSION:', data.session);
  console.log('ERROR:', error);
};

onMounted(() => {
  checkSession();
});

const login = async () => {
  errorMessage.value = "";

  if (!email.value || !password.value) {
    errorMessage.value = "Введите email и пароль";
    return;
  }

  loading.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error.message;
    return;
  }

  await router.push("/daily");
  
};

</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-error {
  margin-bottom: 16px;
  color: #d32f2f;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.login-links a {
  color: var(--green);
  text-decoration: none;
}
</style>