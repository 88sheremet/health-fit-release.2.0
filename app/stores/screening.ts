import { defineStore } from "pinia";

import { Question } from "../interfaces/Question.interface";
import { Block } from "../interfaces/Block.interface";
import { Answers } from "../interfaces/Answers.interface";
import { BlockScores } from "../interfaces/BlockScores.interface";

export const useScreeningStore = defineStore("screening", {
  state: () => ({
    screeningCompleted: false,

    currentBlock: 0,

    answers: {} as Answers,

    blockScores: {} as BlockScores,

    blocks: [
      {
        id: 1,
        title: "Энергия и физическое состояние",
        questions: [
          {
            id: 101,
            text: "Насколько плохое у тебя общее физическое состояние?",
          },
          {
            id: 102,
            text: "Насколько низкий у тебя уровень энергии в течение дня?",
          },
          { id: 103, text: "Насколько у тебя сидячий образ жизни?" },
          {
            id: 104,
            text: "Насколько сильная физическая усталость к концу рабочего дня?",
          },
          { id: 105, text: "Насколько выражены боли в спине, шее или плечах?" },
          {
            id: 106,
            text: "Насколько низкий у тебя уровень силы и выносливости?",
          },
          { id: 107, text: "Насколько выражена скованность/зажатость в теле?" },
          {
            id: 108,
            text: "Насколько долго ты восстанавливаешься после нагрузки?",
          },
          { id: 109, text: "Насколько ты недоволен своей физической формой?" },
        ],
      },

      {
        id: 2,
        title: "Питание и пищевые привычки",
        questions: [
          { id: 201, text: "Насколько плохое качество твоего питания?" },
          { id: 202, text: "Насколько нестабилен твой режим питания?" },
          { id: 203, text: "Насколько ты склонен к перееданию?" },
          { id: 204, text: "Насколько выражены перепады энергии после еды?" },
          {
            id: 205,
            text: "Насколько часто ты ешь “на автомате” без контроля?",
          },
          {
            id: 206,
            text: "Насколько часто ты забываешь пить воду в течение дня?",
          },
          {
            id: 207,
            text: "Насколько выражена зависимость от сладкого или фастфуда?",
          },
          { id: 208, text: "Насколько неосознанно ты питаешься?" },
          {
            id: 209,
            text: "Насколько часто ты ешь в состоянии стресса или усталости?",
          },
        ],
      },

      {
        id: 3,
        title: "Психологическое состояние и поведение",
        questions: [
          { id: 301, text: "Насколько высокий уровень стресса в твоей жизни?" },
          {
            id: 302,
            text: "Насколько тебе тяжело соблюдать дисциплину и постоянство?",
          },
          { id: 303, text: "Насколько часто ты откладываешь важные действия?" },
          { id: 304, text: "Насколько сильно ощущение “нет времени на себя”?" },
          {
            id: 305,
            text: "Насколько ты склонен быстро “сходить с дистанции”?",
          },
          { id: 306, text: "Насколько сложно тебе засыпать?" },
          { id: 307, text: "Насколько нестабилен твой режим сна?" },
          { id: 308, text: "Насколько плохое качество твоего сна?" },
          {
            id: 309,
            text: "Насколько тебе сложно контролировать свои привычки и состояние?",
          },
        ],
      },
    ],
  }),

  getters: {
    currentBlockData: (state) => state.blocks[state.currentBlock],

    progress: (state) => (state.currentBlock + 1) / state.blocks.length,

    dominantProblem(state): string {

  const physical = state.blockScores[1] || 0
  const food = state.blockScores[2] || 0
  const mind = state.blockScores[3] || 0

  const max = Math.max(
    physical,
    food,
    mind
  )

  if (max === physical) {
    return 'physical'
  }

  if (max === food) {
    return 'food'
  }

  return 'mind'
},
  },

  actions: {
     completeScreening() {
      this.screeningCompleted = true
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
      this.currentBlock = 0;
      this.answers = {};
      this.blockScores = {};
    },
  },

  persist: true,
});
