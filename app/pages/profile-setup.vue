<template>
  <div class="profile-setup-page">
    <q-card class="profile-card">
      <div class="profile-heading">Как к вам обращаться?</div>

      <q-form class="profile-form" @submit.prevent="saveProfile">
        <q-input
          v-model="name"
          label="Ваше имя"
          placeholder="Введите ваше имя"
          outlined
          rounded
          maxlength="100"
          autocomplete="given-name"
          class="name-input"
          :rules="[(value) => !!value?.trim() || 'Укажите имя']"
        >
          <template #prepend>
            <q-icon name="person" class="name-icon" />
          </template>
        </q-input>

        <div class="gender-heading">Пол</div>

        <q-option-group
          v-model="gender"
          :options="genderOptions"
          type="radio"
          color="primary"
          class="gender-options"
        />

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <q-btn
          type="submit"
          label="Продолжить"
          color="primary"
          unelevated
          rounded
          class="continue-btn"
          :loading="loading"
          :disable="!name.trim() || !gender || loading"
        />
      </q-form>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { routes } from "~/router/routes";

definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

type Gender = "male" | "female";

const supabase = useSupabaseClient();
const router = useRouter();

const name = ref("");
const gender = ref<Gender | null>(null);
const loading = ref(false);
const errorMessage = ref("");

const genderOptions = [
  { label: "Мужской", value: "male" },
  { label: "Женский", value: "female" },
];

onMounted(async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await router.replace(routes.auth.login);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, gender")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Profile Setup] Ошибка загрузки:", error);
      errorMessage.value = "Не удалось загрузить профиль. Попробуйте ещё раз.";
      return;
    }

    const metadata = user.user_metadata ?? {};

    name.value = profile?.name || metadata.full_name || metadata.name || "";

    if (profile?.gender === "male" || profile?.gender === "female") {
      gender.value = profile.gender;
    }
  } catch (error) {
    console.error("[Profile Setup] Ошибка загрузки:", error);
    errorMessage.value = "Не удалось загрузить профиль. Попробуйте ещё раз.";
  }
});

async function saveProfile() {
  errorMessage.value = "";

  if (!name.value.trim() || !gender.value || loading.value) {
    return;
  }

  loading.value = true;

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await router.replace(routes.auth.login);
      return;
    }

    const profileData = {
      user_id: user.id,
      name: name.value.trim(),
      gender: gender.value,
      updated_at: new Date().toISOString(),
      avatar:
        user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
    };

    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(profileData, {
        onConflict: "user_id",
      });

    if (saveError) {
      throw saveError;
    }

    const { data: screening, error: screeningError } = await supabase
      .from("screening_results")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (screeningError) {
      throw screeningError;
    }

    await router.replace(
      screening ? routes.recovery.daily : routes.onboarding.welcome,
    );
  } catch (error) {
    console.error("[Profile Setup] Ошибка сохранения:", error);

    errorMessage.value =
      "Не удалось сохранить профиль. Проверьте соединение и попробуйте ещё раз.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.profile-setup-page {
  min-height: calc(100vh - 56px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
  background: var(--bg-gradient-main);
}

.profile-card {
  width: 100%;
  max-width: 420px;
  padding: 28px 24px;
  border-radius: 20px;
}

.profile-heading {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
  color: var(--black1);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.name-input {
  margin-bottom: 4px;
}

.name-input :deep(.q-field__control) {
  min-height: 60px;
  border-radius: 16px;
  background: #f8fbf8;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.name-input :deep(.q-field__control::before) {
  border: 1.5px solid #dce8dd;
  border-radius: 16px;
  transition: border-color 0.2s ease;
}

.name-input :deep(.q-field__control::after) {
  border-radius: 16px;
  opacity: 0;
  transform: none;
}

.name-input :deep(.q-field--focused .q-field__control::after) {
  opacity: 0;
}

.name-input :deep(.q-field__native),
.name-input :deep(.q-field__input) {
  color: var(--black1);
  font-size: 16px;
  font-weight: 500;
}

.name-input :deep(.q-field__label) {
  color: #718273;
  font-size: 14px;
}

.name-input :deep(.q-field__control:focus-within::before) {
  border-color: var(--green);
}

.name-input :deep(.q-field__control:focus-within) {
  background: #ffffff;
  box-shadow: 0 0 0 3px rgb(75 145 91 / 10%);
}

.name-icon {
  color: #7ca982;
  font-size: 22px;
}

.gender-heading {
  font-size: 16px;
  font-weight: 600;
  color: var(--black1);
}

.gender-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.continue-btn {
  width: 100%;
  min-height: 48px;
  margin-top: 8px;
}

.error-message {
  color: #c62828;
  font-size: 14px;
}

@media (max-width: 480px) {
  .profile-card {
    padding: 24px 20px;
  }

  .profile-heading {
    font-size: 22px;
  }
}
</style>
