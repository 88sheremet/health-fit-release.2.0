import { defineStore } from "pinia";

import { DominantProblem } from "../enums/DominantProblem.enum";

import type { Question } from "../interfaces/Question.interface";
import type { Block } from "../interfaces/Block.interface";
import type { Answers } from "../interfaces/Answers.interface";
import type { BlockScores } from "../interfaces/BlockScores.interface";

const SCREENING_BLOCKS: Block[] = [
  {
    id: 1,
    title: "screeningBlocks.physical.title",
    questions: [
      { id: 101, text: "screeningBlocks.physical.q101" },
      { id: 102, text: "screeningBlocks.physical.q102" },
      { id: 103, text: "screeningBlocks.physical.q103" },
      { id: 104, text: "screeningBlocks.physical.q104" },
      { id: 105, text: "screeningBlocks.physical.q105" },
      { id: 106, text: "screeningBlocks.physical.q106" },
      { id: 107, text: "screeningBlocks.physical.q107" },
      { id: 108, text: "screeningBlocks.physical.q108" },
      { id: 109, text: "screeningBlocks.physical.q109" },
    ],
  },

  {
    id: 2,
    title: "screeningBlocks.food.title",
    questions: [
      { id: 201, text: "screeningBlocks.food.q201" },
      { id: 202, text: "screeningBlocks.food.q202" },
      { id: 203, text: "screeningBlocks.food.q203" },
      { id: 204, text: "screeningBlocks.food.q204" },
      { id: 205, text: "screeningBlocks.food.q205" },
      { id: 206, text: "screeningBlocks.food.q206" },
      { id: 207, text: "screeningBlocks.food.q207" },
      { id: 208, text: "screeningBlocks.food.q208" },
      { id: 209, text: "screeningBlocks.food.q209" },
    ],
  },

  {
    id: 3,
    title: "screeningBlocks.mind.title",
    questions: [
      { id: 301, text: "screeningBlocks.mind.q301" },
      { id: 302, text: "screeningBlocks.mind.q302" },
      { id: 303, text: "screeningBlocks.mind.q303" },
      { id: 304, text: "screeningBlocks.mind.q304" },
      { id: 305, text: "screeningBlocks.mind.q305" },
      { id: 306, text: "screeningBlocks.mind.q306" },
      { id: 307, text: "screeningBlocks.mind.q307" },
      { id: 308, text: "screeningBlocks.mind.q308" },
      { id: 309, text: "screeningBlocks.mind.q309" },
    ],
  },
];

export const useScreeningStore = defineStore("screening", {
  state: () => ({
    screeningCompleted: false,

    currentBlock: 0,

    answers: {} as Answers,

    blockScores: {} as BlockScores,

    loading: false,

    error: null as string | null,
  }),

  getters: {
    blocks: () => SCREENING_BLOCKS,

    currentBlockData(): Block {
      return SCREENING_BLOCKS[this.currentBlock];
    },

    progress: (state) => (state.currentBlock + 1) / SCREENING_BLOCKS.length,

    dominantProblem(state): DominantProblem {
      const physical = state.blockScores[1] || 0;
      const food = state.blockScores[2] || 0;
      const mind = state.blockScores[3] || 0;

      const max = Math.max(physical, food, mind);

      if (max === physical) {
        return DominantProblem.Physical;
      }

      if (max === food) {
        return DominantProblem.Food;
      }

      return DominantProblem.Mind;
    },
  },

  actions: {
    async loadScreening() {
      this.loading = true;
      this.error = null;

      try {
        const supabase = useSupabaseClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          this.resetScreening();
          return;
        }

        const { data, error } = await supabase
          .from("screening_results")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          this.resetScreening();
          return;
        }

        this.answers = (data.answers || {}) as Answers;

        this.blockScores = {
          1: Number(data.physical_score || 0),
          2: Number(data.food_score || 0),
          3: Number(data.mind_score || 0),
        } as BlockScores;

        this.screeningCompleted = true;
      } catch (error: any) {
        console.error("[Screening] Ошибка загрузки:", error);

        this.error =
          error?.message || "Не удалось загрузить результат скрининга";
      } finally {
        this.loading = false;
      }
    },

    async saveScreening() {
      this.loading = true;
      this.error = null;

      try {
        const supabase = useSupabaseClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error("Пользователь не авторизован");
        }

        const { error } = await supabase.from("screening_results").upsert(
          {
            user_id: user.id,

            answers: this.answers,

            physical_score: this.blockScores[1] || 0,
            food_score: this.blockScores[2] || 0,
            mind_score: this.blockScores[3] || 0,

            completed_at: new Date().toISOString(),

            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          },
        );

        if (error) {
          throw error;
        }

        this.screeningCompleted = true;

        console.log("[Screening] Результат сохранён в Supabase");
      } catch (error: any) {
        console.error("[Screening] Ошибка сохранения:", error);

        this.error =
          error?.message || "Не удалось сохранить результат скрининга";

        throw error;
      } finally {
        this.loading = false;
      }
    },

    async completeScreening() {
      await this.saveScreening();
    },

    setAnswer(questionId: number, value: number) {
      this.answers[questionId] = value;
    },

    validateCurrentBlock() {
      return this.currentBlockData.questions.every((q) => this.answers[q.id]);
    },

    calculateCurrentBlockScore() {
      const block = this.currentBlockData;

      let total = 0;

      block.questions.forEach((q) => {
        total += this.answers[q.id] || 0;
      });

      this.blockScores[block.id] = total;
    },

    nextBlock() {
      this.calculateCurrentBlockScore();

      if (this.currentBlock < this.blocks.length - 1) {
        this.currentBlock++;
      }
    },

    isLastBlock() {
      return this.currentBlock === this.blocks.length - 1;
    },

    resetScreening() {
      this.screeningCompleted = false;
      this.currentBlock = 0;
      this.answers = {};
      this.blockScores = {};
      this.error = null;
    },
  },

  persist: true,
});
