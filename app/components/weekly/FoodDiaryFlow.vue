<template>
  <div class="food-diary">
    <div class="intro">
      <div class="eyebrow">ТВОИ ПИЩЕВЫЕ ПРИВЫЧКИ</div>
      <h2>Дневник питания: 2 дня под микроскопом</h2>
      <p>
        Записывай еду и напитки без подсчёта калорий и взвешивания продуктов. В
        конце ты сможешь проверить обе записи перед анализом.
      </p>
    </div>

    <div class="steps">
      <div
        v-for="item in steps"
        :key="item.id"
        class="step"
        :class="{
          active: stageIndex >= item.id,
          current: stageIndex === item.id,
        }"
      >
        <span class="step-number">{{ item.id + 1 }}</span>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <q-banner v-if="errorMessage" class="error-banner" rounded>{{
      errorMessage
    }}</q-banner>

    <div v-if="loading" class="loading-state">
      <q-spinner size="32px" />
      <p>Загружаем дневник...</p>
    </div>

    <template v-else>
      <q-card v-if="stage === 'collecting'" class="diary-card">
        <div class="card-heading">
          <div>
            <h3>Выбери два дня</h3>
            <p>Можно выбрать любые две разные даты.</p>
          </div>
        </div>

        <div class="date-grid">
          <q-input
            v-model="firstDate"
            label="Первый день"
            type="date"
            outlined
            stack-label
            :disable="saving"
          />
          <q-input
            v-model="secondDate"
            label="Второй день"
            type="date"
            outlined
            stack-label
            :disable="saving"
          />
        </div>

        <q-btn
          label="Сохранить даты"
          color="primary"
          no-caps
          unelevated
          class="primary-btn"
          :loading="savingDates"
          :disable="!datesAreValid || saving"
          @click="saveDates"
        />

        <template v-if="sessionSaved">
          <q-separator class="separator" />
          <div class="section-heading">
            <h3>
              {{ editingId ? "Редактировать запись" : "Добавить запись" }}
            </h3>
            <p>Записывай всё, что ел и пил в выбранные дни.</p>
          </div>

          <q-form class="entry-form" @submit.prevent="saveEntry">
            <q-select
              v-model="form.entry_date"
              :options="dateOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Дата"
              outlined
              :disable="saving"
              :rules="[(value) => !!value || 'Выбери дату']"
            />
            <q-select
              v-model="form.meal_type"
              :options="mealTypeOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              label="Приём пищи"
              outlined
              :disable="saving"
              :rules="[(value) => !!value || 'Выбери тип записи']"
            />
            <q-input
              v-model="form.meal_time"
              label="Время"
              type="time"
              outlined
              :disable="saving"
            />
            <q-input
              v-model="form.description"
              label="Что ты ел или пил? (Чем подробнее тем лучше)"
              type="textarea"
              autogrow
              outlined
              :disable="saving"
              :rules="[(value) => !!value?.trim() || 'Добавь описание']"
            />
            <q-input
              v-model="form.feeling"
              label="Как ты себя чувствовал? (необязательно)"
              type="textarea"
              autogrow
              outlined
              hint="Например: был голоден, устал, ел за компьютером"
              :disable="saving"
            />

            <div class="form-actions">
              <q-btn
                v-if="editingId"
                label="Отменить редактирование"
                flat
                no-caps
                :disable="saving"
                @click="resetForm"
              />
              <q-btn
                :label="editingId ? 'Сохранить изменения' : 'Сохранить запись'"
                type="submit"
                color="primary"
                unelevated
                no-caps
                :loading="savingEntry"
                :disable="saving"
              />
            </div>
          </q-form>

          <q-separator class="separator" />
          <div class="entries-heading">
            <h3>Твои записи</h3>
            <span>{{ entries.length }}</span>
          </div>

          <div v-if="entries.length === 0" class="empty-state">
            Записей пока нет. Добавь первый приём пищи или напиток.
          </div>
          <div v-else class="entry-list">
            <q-card
              v-for="entry in sortedEntries"
              :key="entry.id"
              flat
              bordered
              class="entry-card"
            >
              <div class="entry-meta">
                <span>{{ dateLabel(entry.entry_date) }}</span>
                <span>{{ mealLabel(entry.meal_type) }}</span>
                <span v-if="entry.meal_time">{{
                  entry.meal_time.slice(0, 5)
                }}</span>
              </div>
              <div class="entry-description">{{ entry.description }}</div>
              <div v-if="entry.feeling" class="entry-feeling">
                {{ entry.feeling }}
              </div>
              <div class="entry-actions">
                <q-btn
                  label="Изменить"
                  flat
                  dense
                  no-caps
                  color="primary"
                  :disable="saving"
                  @click="editEntry(entry)"
                />
                <q-btn
                  label="Удалить"
                  flat
                  dense
                  no-caps
                  color="negative"
                  :disable="saving"
                  @click="confirmDelete(entry)"
                />
              </div>
            </q-card>
          </div>

          <q-btn
            label="Проверить оба дня"
            color="primary"
            unelevated
            no-caps
            class="primary-btn"
            :disable="!hasEntriesForBothDays || saving"
            :loading="openingReview"
            @click="goToReview"
          />
          <p
            v-if="entries.length && !hasEntriesForBothDays"
            class="validation-hint"
          >
            Добавь хотя бы одну запись за каждый выбранный день, чтобы
            продолжить.
          </p>
        </template>
      </q-card>

      <q-card v-else class="diary-card">
        <div class="card-heading">
          <div>
            <h3>
              {{
                stage === "review"
                  ? "Проверь свой дневник"
                  : "Анализ дневника питания"
              }}
            </h3>
            <p>
              {{
                stage === "review"
                  ? "Убедись, что всё записано правильно. Ты можешь вернуться и отредактировать записи."
                  : "Записи проанализированы. Ниже сохранён результат для этой недели."
              }}
            </p>
          </div>
        </div>

        <div class="review-day">
          <h3>День 1 · {{ dateLabel(firstDate) }}</h3>
          <div
            v-if="entriesForDate(firstDate).length === 0"
            class="empty-state"
          >
            За этот день записей нет.
          </div>
          <div
            v-for="entry in entriesForDate(firstDate)"
            :key="entry.id"
            class="review-entry"
          >
            <div class="review-time">
              {{
                entry.meal_time
                  ? entry.meal_time.slice(0, 5)
                  : "Время не указано"
              }}
              · {{ mealLabel(entry.meal_type) }}
            </div>
            <div class="entry-description">{{ entry.description }}</div>
            <div v-if="entry.feeling" class="entry-feeling">
              {{ entry.feeling }}
            </div>
          </div>
        </div>

        <q-separator class="separator" />

        <div class="review-day">
          <h3>День 2 · {{ dateLabel(secondDate) }}</h3>
          <div
            v-if="entriesForDate(secondDate).length === 0"
            class="empty-state"
          >
            За этот день записей нет.
          </div>
          <div
            v-for="entry in entriesForDate(secondDate)"
            :key="entry.id"
            class="review-entry"
          >
            <div class="review-time">
              {{
                entry.meal_time
                  ? entry.meal_time.slice(0, 5)
                  : "Время не указано"
              }}
              · {{ mealLabel(entry.meal_type) }}
            </div>
            <div class="entry-description">{{ entry.description }}</div>
            <div v-if="entry.feeling" class="entry-feeling">
              {{ entry.feeling }}
            </div>
          </div>
        </div>

        <template v-if="stage === 'ready' && analysis">
          <q-separator class="separator" />
          <section class="analysis-result">
            <h3>Что удалось заметить</h3>
            <p>{{ analysis.summary }}</p>

            <h3>Закономерности</h3>
            <article
              v-for="(item, index) in analysis.patterns"
              :key="`pattern-${index}`"
              class="analysis-item"
            >
              <strong>{{ item.title }}</strong>
              <p>{{ item.explanation }}</p>
              <p class="entry-feeling">Основание: {{ item.evidence }}</p>
            </article>

            <h3>Рекомендации</h3>
            <article
              v-for="(item, index) in analysis.recommendations"
              :key="`recommendation-${index}`"
              class="analysis-item"
            >
              <strong>{{ item.title }}</strong>
              <p>{{ item.explanation }}</p>
            </article>

            <h3>Три следующих шага</h3>
            <article
              v-for="(item, index) in analysis.actions"
              :key="`action-${index}`"
              class="analysis-item"
            >
              <strong>{{ index + 1 }}. {{ item.title }}</strong>
              <p>{{ item.description }}</p>
            </article>
            <p class="analysis-limitations">{{ analysis.limitations }}</p>
          </section>
        </template>

        <div class="review-actions">
          <q-btn
            v-if="stage === 'review' || !analysis"
            label="Вернуться к редактированию"
            outline
            no-caps
            color="primary"
            :disable="saving"
            @click="returnToEditing"
          />
          <q-btn
            v-if="stage === 'review'"
            label="Всё верно, провести анализ"
            color="primary"
            unelevated
            no-caps
            :loading="analyzing"
            :disable="saving || !hasEntriesForBothDays"
            @click="confirmDiary"
          />
          <q-btn
            v-else
            label="Вернуться к дневнику"
            color="primary"
            unelevated
            no-caps
            :disable="saving"
            @click="returnToEditing"
          />
        </div>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useQuasar } from "quasar";
import {
  deleteFoodDiaryEntry,
  loadFoodDiary,
  saveFoodDiaryDates,
  saveFoodDiaryEntry,
  setFoodDiaryStage,
} from "~/services/weeklyFoodDiary.service";
import type {
  FoodDiaryAnalysis,
  FoodDiaryEntry,
  FoodDiaryMealType,
  FoodDiaryStage,
} from "~/services/weeklyFoodDiary.service";

const props = defineProps<{ taskId: string; programWeek: number }>();
const $q = useQuasar();
const loading = ref(true);
const saving = ref(false);
const savingDates = ref(false);
const savingEntry = ref(false);
const openingReview = ref(false);
const analyzing = ref(false);
const errorMessage = ref("");
const firstDate = ref("");
const secondDate = ref("");
const stage = ref<FoodDiaryStage>("collecting");
const sessionSaved = ref(false);
const entries = ref<FoodDiaryEntry[]>([]);
const analysis = ref<FoodDiaryAnalysis | null>(null);
const editingId = ref<string | null>(null);

const form = reactive({
  entry_date: "",
  meal_type: "breakfast" as FoodDiaryMealType,
  meal_time: "",
  description: "",
  feeling: "",
});

const steps = [
  { id: 0, label: "Записи" },
  { id: 1, label: "Проверка" },
  { id: 2, label: "Анализ" },
];

const stageIndex = computed(() =>
  stage.value === "review" ? 1 : stage.value === "ready" ? 2 : 0,
);
const datesAreValid = computed(
  () =>
    !!firstDate.value &&
    !!secondDate.value &&
    firstDate.value !== secondDate.value,
);
const dateOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];
  if (firstDate.value)
    options.push({
      label: `День 1 · ${dateLabel(firstDate.value)}`,
      value: firstDate.value,
    });
  if (secondDate.value)
    options.push({
      label: `День 2 · ${dateLabel(secondDate.value)}`,
      value: secondDate.value,
    });
  return options;
});
const mealTypeOptions: { label: string; value: FoodDiaryMealType }[] = [
  { label: "Сніданок", value: "breakfast" },
  { label: "Обід", value: "lunch" },
  { label: "Вечеря", value: "dinner" },
  { label: "Перекус", value: "snack" },
  { label: "Напій", value: "drink" },
];
const sortedEntries = computed(() =>
  [...entries.value].sort((a, b) => {
    const dateCompare = a.entry_date.localeCompare(b.entry_date);
    return dateCompare !== 0
      ? dateCompare
      : (a.meal_time ?? "").localeCompare(b.meal_time ?? "");
  }),
);
const hasEntriesForBothDays = computed(
  () =>
    !!firstDate.value &&
    !!secondDate.value &&
    entries.value.some((entry) => entry.entry_date === firstDate.value) &&
    entries.value.some((entry) => entry.entry_date === secondDate.value),
);

function dateLabel(value: string | null): string {
  if (!value) return "Дата не выбрана";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
function mealLabel(type: FoodDiaryMealType): string {
  return mealTypeOptions.find((option) => option.value === type)?.label ?? type;
}
function entriesForDate(date: string): FoodDiaryEntry[] {
  return sortedEntries.value.filter((entry) => entry.entry_date === date);
}
function resetForm() {
  editingId.value = null;
  form.entry_date = firstDate.value || secondDate.value || "";
  form.meal_type = "breakfast";
  form.meal_time = "";
  form.description = "";
  form.feeling = "";
}
function editEntry(entry: FoodDiaryEntry) {
  editingId.value = entry.id;
  form.entry_date = entry.entry_date;
  form.meal_type = entry.meal_type;
  form.meal_time = entry.meal_time?.slice(0, 5) ?? "";
  form.description = entry.description;
  form.feeling = entry.feeling ?? "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function loadData() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const result = await loadFoodDiary(props.taskId, props.programWeek);
    entries.value = result.entries;
    if (result.session) {
      firstDate.value = result.session.first_date ?? "";
      secondDate.value = result.session.second_date ?? "";
      stage.value = result.session.stage;
      analysis.value = result.session.analysis ?? null;
      sessionSaved.value = !!(
        result.session.first_date && result.session.second_date
      );
    } else {
      firstDate.value = "";
      secondDate.value = "";
      stage.value = "collecting";
      analysis.value = null;
      sessionSaved.value = false;
    }
    resetForm();
  } catch (error) {
    console.error("[FoodDiaryFlow] Не удалось загрузить дневник:", error);
    errorMessage.value = "Не удалось загрузить дневник. Попробуй ещё раз.";
  } finally {
    loading.value = false;
  }
}

async function saveDates() {
  if (!datesAreValid.value) {
    errorMessage.value = "Выбери две разные даты.";
    return;
  }
  savingDates.value = true;
  errorMessage.value = "";
  try {
    const result = await saveFoodDiaryDates(
      props.taskId,
      props.programWeek,
      firstDate.value,
      secondDate.value,
    );
    firstDate.value = result.first_date ?? "";
    secondDate.value = result.second_date ?? "";
    stage.value = "collecting";
    analysis.value = null;
    sessionSaved.value = true;
    // The service prevents changing dates if that would orphan existing entries.
    resetForm();
  } catch (error) {
    console.error("[FoodDiaryFlow] Не удалось сохранить даты:", error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Не удалось сохранить даты. Попробуй ещё раз.";
  } finally {
    savingDates.value = false;
  }
}

async function saveEntry() {
  if (!form.entry_date || !form.description.trim()) {
    errorMessage.value = "Укажи дату и описание еды или напитка.";
    return;
  }
  savingEntry.value = true;
  errorMessage.value = "";
  try {
    const saved = await saveFoodDiaryEntry(props.taskId, props.programWeek, {
      id: editingId.value ?? undefined,
      entry_date: form.entry_date,
      meal_type: form.meal_type,
      meal_time: form.meal_time,
      description: form.description,
      feeling: form.feeling,
    });
    const existingIndex = entries.value.findIndex(
      (entry) => entry.id === saved.id,
    );
    if (existingIndex >= 0) entries.value[existingIndex] = saved;
    else entries.value.push(saved);
    stage.value = "collecting";
    analysis.value = null;
    resetForm();
    $q.notify({
      type: "positive",
      message: "Запись сохранена",
      position: "top",
    });
  } catch (error) {
    console.error("[FoodDiaryFlow] Не удалось сохранить запись:", error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Не удалось сохранить запись. Попробуй ещё раз.";
  } finally {
    savingEntry.value = false;
  }
}

function confirmDelete(entry: FoodDiaryEntry) {
  $q.dialog({
    title: "Удалить запись?",
    message: "Эту запись нельзя будет восстановить.",
    cancel: { label: "Отмена", flat: true, noCaps: true },
    ok: { label: "Удалить", color: "negative", noCaps: true },
    persistent: true,
  }).onOk(async () => {
    saving.value = true;
    errorMessage.value = "";
    try {
      await deleteFoodDiaryEntry(props.taskId, props.programWeek, entry.id);
      entries.value = entries.value.filter((item) => item.id !== entry.id);
      analysis.value = null;
      stage.value = "collecting";
      if (editingId.value === entry.id) resetForm();
      $q.notify({
        type: "positive",
        message: "Запись удалена",
        position: "top",
      });
    } catch (error) {
      console.error("[FoodDiaryFlow] Не удалось удалить запись:", error);
      errorMessage.value =
        error instanceof Error
          ? error.message
          : "Не удалось удалить запись. Попробуй ещё раз.";
    } finally {
      saving.value = false;
    }
  });
}

async function goToReview() {
  openingReview.value = true;
  errorMessage.value = "";
  try {
    await setFoodDiaryStage(props.taskId, props.programWeek, "review");
    stage.value = "review";
    resetForm();
  } catch (error) {
    console.error("[FoodDiaryFlow] Не удалось открыть проверку:", error);
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Не удалось открыть проверку дневника.";
  } finally {
    openingReview.value = false;
  }
}

async function returnToEditing() {
  saving.value = true;
  errorMessage.value = "";
  try {
    await setFoodDiaryStage(props.taskId, props.programWeek, "collecting");
    stage.value = "collecting";
    analysis.value = null;
    resetForm();
  } catch (error) {
    console.error(
      "[FoodDiaryFlow] Не удалось вернуться к редактированию:",
      error,
    );
    errorMessage.value =
      error instanceof Error
        ? error.message
        : "Не удалось открыть редактирование.";
  } finally {
    saving.value = false;
  }
}

async function confirmDiary() {
  analyzing.value = true;
  errorMessage.value = "";

  try {
    const supabase = useSupabaseClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError) throw authError;

    if (!session?.access_token) {
      throw new Error("Сессия завершилась. Войди в приложение заново.");
    }

    const result = await $fetch<{ analysis?: FoodDiaryAnalysis }>(
      "/api/food-diary/analyze",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          taskId: props.taskId,
          programWeek: props.programWeek,
        },
        timeout: 130_000,
      },
    );

    if (
      !result?.analysis ||
      typeof result.analysis.summary !== "string"
    ) {
      console.error("[FoodDiaryFlow] API вернул пустой анализ:", result);
      throw new Error(
        "Анализ выполнен, но его результат не получен. Проверь ответ API.",
      );
    }

    analysis.value = result.analysis;
    stage.value = "ready";

    $q.notify({
      type: "positive",
      message: "Анализ дневника готов!",
      position: "top",
    });
  } catch (error: any) {
    console.error("[FoodDiaryFlow] Ошибка анализа:", error);

    errorMessage.value =
      error?.data?.statusMessage ||
      error?.data?.message ||
      error?.message ||
      "Не удалось получить результат анализа.";
  } finally {
    analyzing.value = false;
  }
}

watch(
  () => [props.taskId, props.programWeek],
  () => loadData(),
);
onMounted(loadData);
</script>

<style scoped>
.food-diary {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.intro {
  padding: 4px 2px;
}
.eyebrow {
  margin-bottom: 10px;
  color: var(--green-deep);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}
.intro h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.25;
  font-weight: 750;
}
.intro p,
.card-heading p,
.section-heading p {
  margin: 10px 0 0;
  color: var(--grey-dark);
  line-height: 1.6;
}
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.step {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--grey);
  font-size: 12px;
}
.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--grey-hover);
  font-weight: 700;
}
.step.active {
  color: var(--green-deep);
}
.step.active .step-number {
  background: var(--green-bg);
  color: var(--green-deep);
}
.step.current {
  font-weight: 700;
}
.diary-card {
  padding: 22px;
  border-radius: 24px;
}
.card-heading h3,
.section-heading h3,
.entries-heading h3,
.review-day h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}
.date-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.primary-btn {
  width: 100%;
  min-height: 50px;
  margin-top: 18px;
  border-radius: 14px;
}
.separator {
  margin: 24px 0;
}
.entry-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}
.form-actions,
.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}
.form-actions :deep(.q-btn),
.review-actions :deep(.q-btn) {
  min-height: 44px;
  border-radius: 12px;
}
.entries-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.entries-heading span {
  color: var(--green-deep);
  font-weight: 700;
}
.entry-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.entry-card {
  padding: 16px;
  border-color: var(--grey-hover);
  border-radius: 16px;
}
.entry-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  color: var(--grey);
  font-size: 12px;
}
.entry-description {
  color: var(--grey-dark);
  line-height: 1.6;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
.entry-feeling {
  margin-top: 8px;
  color: var(--grey);
  font-size: 13px;
  line-height: 1.5;
}
.entry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
}
.review-day {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.review-entry {
  padding: 14px;
  border: 1px solid var(--grey-hover);
  border-radius: 14px;
}
.review-time {
  margin-bottom: 8px;
  color: var(--green-deep);
  font-size: 13px;
  font-weight: 700;
}
.review-actions {
  margin-top: 24px;
}
.empty-state {
  padding: 16px;
  border-radius: 14px;
  background: var(--grey-hover);
  color: var(--grey-dark);
  line-height: 1.5;
}
.error-banner {
  background: rgba(193, 53, 53, 0.08);
  color: var(--negative);
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px;
  color: var(--grey);
}
.validation-hint {
  margin: 10px 0 0;
  color: var(--grey-dark);
  font-size: 13px;
  line-height: 1.5;
}
.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.analysis-result h3 {
  margin: 12px 0 0;
  font-size: 18px;
  font-weight: 700;
}
.analysis-result p {
  margin: 6px 0 0;
  color: var(--grey-dark);
  line-height: 1.6;
}
.analysis-item {
  padding: 16px;
  border: 1px solid var(--grey-hover);
  border-radius: 14px;
}
.analysis-item strong {
  line-height: 1.5;
}
.analysis-limitations {
  padding: 14px;
  border-radius: 12px;
  background: var(--grey-hover);
}
@media (max-width: 520px) {
  .diary-card {
    padding: 18px;
  }
  .intro h2 {
    font-size: 23px;
  }
  .date-grid {
    grid-template-columns: 1fr;
  }
  .steps {
    gap: 5px;
  }
  .step {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
  .form-actions,
  .review-actions {
    flex-direction: column;
  }
  .form-actions :deep(.q-btn),
  .review-actions :deep(.q-btn) {
    width: 100%;
  }
}
</style>
