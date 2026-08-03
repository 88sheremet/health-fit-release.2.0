import { c as createComponent, _ as _plugin_vue_export_helper_default, u as useQuasar, n as navigateTo } from '../virtual/entry.mjs';
import { r as routes } from './routes-D1jq-K_x.mjs';
import { u as useScreeningStore } from './screening-DvSbJSAX.mjs';
import { getCurrentInstance, computed, h, defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, openBlock, createBlock, Fragment, renderList, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';
import { u as useDarkProps, a as useDark, Q as QCard } from '../_/QCard.mjs';
import { u as useSizeProps, a as useSize, Q as QBtn } from '../_/QBtn.mjs';
import { b as hMergeSlot } from '../_/render.mjs';
import 'nostics';
import 'nostics/formatters/ansi';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'unhead/server';
import 'unhead/legacy';
import 'unhead/plugins';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import 'pinia';
import 'vue-router';
import '@vue/shared';
import '@supabase/supabase-js';
import 'unhead/utils';

const defaultSizes = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 10,
  xl: 14
};

function width(val) {
  return {
    transform: `scale3d(${val},1,1)`
  }
}

const QLinearProgress = createComponent({
  name: 'QLinearProgress',

  props: {
    ...useDarkProps,
    ...useSizeProps,

    value: {
      type: Number,
      default: 0
    },
    buffer: Number,

    color: String,
    trackColor: String,

    reverse: Boolean,
    stripe: Boolean,
    indeterminate: Boolean,
    query: Boolean,
    rounded: Boolean,

    animationSpeed: {
      type: [String, Number],
      default: 2100
    },

    instantFeedback: Boolean
  },

  setup(props, { slots }) {
    const { proxy } = getCurrentInstance();
    const isDark = useDark(props, proxy.$q);
    const sizeStyle = useSize(props, defaultSizes);

    const motion = computed(() => props.indeterminate || props.query);
    const style = computed(() => ({
      ...(sizeStyle.value !== null ? sizeStyle.value : {}),
      '--q-linear-progress-speed': `${props.animationSpeed}ms`
    }));

    const classes = computed(
      () =>
        'q-linear-progress' +
        (props.color !== void 0 ? ` text-${props.color}` : '') +
        (props.reverse || props.query ? ' q-linear-progress--reverse' : '') +
        (props.rounded ? ' rounded-borders' : '')
    );

    const trackStyle = computed(() =>
      width(props.buffer !== void 0 ? props.buffer : 1)
    );
    const transitionSuffix = computed(
      () => `with${props.instantFeedback ? 'out' : ''}-transition`
    );

    const trackClass = computed(
      () =>
        'q-linear-progress__track absolute-full' +
        ` q-linear-progress__track--${transitionSuffix.value}` +
        ` q-linear-progress__track--${isDark.value ? 'dark' : 'light'}` +
        (props.trackColor !== void 0 ? ` bg-${props.trackColor}` : '')
    );

    const modelStyle = computed(() => width(motion.value ? 1 : props.value));
    const modelClass = computed(
      () =>
        'q-linear-progress__model absolute-full' +
        ` q-linear-progress__model--${transitionSuffix.value}` +
        ` q-linear-progress__model--${motion.value ? 'in' : ''}determinate`
    );

    const stripeStyle = computed(() => ({ width: `${props.value * 100}%` }));
    const stripeClass = computed(
      () =>
        `q-linear-progress__stripe absolute-${props.reverse ? 'right' : 'left'}` +
        ` q-linear-progress__stripe--${transitionSuffix.value}`
    );

    return () => {
      const child = [
        h('div', {
          class: trackClass.value,
          style: trackStyle.value
        }),

        h('div', {
          class: modelClass.value,
          style: modelStyle.value
        })
      ];

      if (props.stripe && !motion.value) {
        child.push(
          h('div', {
            class: stripeClass.value,
            style: stripeStyle.value
          })
        );
      }

      return h(
        'div',
        {
          class: classes.value,
          style: style.value,
          role: 'progressbar',
          'aria-valuemin': 0,
          'aria-valuemax': 1,
          'aria-valuenow': props.indeterminate ? void 0 : props.value
        },
        hMergeSlot(slots.default, child)
      )
    }
  }
});

//#region app/pages/questions.vue?vue&type=script&setup=true&lang.ts
var questions_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "questions",
	__ssrInlineRender: true,
	setup(__props) {
		const screeningStore = useScreeningStore();
		const $q = useQuasar();
		const pageRef = ref(null);
		const questionRefs = ref([]);
		const showValidation = ref(false);
		const answeredQuestions = computed(() => screeningStore.currentBlockData.questions.filter((q) => screeningStore.answers[q.id] !== void 0).length);
		const scrollToFirstEmpty = async () => {
			await nextTick();
			const index = screeningStore.currentBlockData.questions.findIndex((q) => screeningStore.answers[q.id] === void 0);
			if (index === -1) return;
			(questionRefs.value?.[index])?.$el?.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		};
		const showValidationAlert = () => {
			$q.notify({
				message: "Не все вопросы заполнены. Ответь на выделенный вопрос, чтобы продолжить.",
				type: "warning",
				timeout: 2500
			});
		};
		const goNext = async () => {
			showValidation.value = true;
			if (!screeningStore.validateCurrentBlock()) {
				showValidationAlert();
				await scrollToFirstEmpty();
				return;
			}
			if (screeningStore.isLastBlock()) {
				screeningStore.calculateCurrentBlockScore();
				screeningStore.completeScreening();
				const result = screeningStore.dominantProblem;
				if (result === "physical") navigateTo(routes.results.physical);
				else if (result === "food") navigateTo(routes.results.food);
				else navigateTo(routes.results.mind);
				return;
			}
			screeningStore.nextBlock();
			showValidation.value = false;
			await nextTick();
			pageRef.value?.scrollTo({
				top: 0,
				behavior: "smooth"
			});
		};
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_linear_progress = QLinearProgress;
			const _component_q_card = QCard;
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({
				class: "questions-page",
				ref_key: "pageRef",
				ref: pageRef
			}, _attrs))} data-v-9e809394><div class="header" data-v-9e809394><div class="header-top" data-v-9e809394><div class="block-counter" data-v-9e809394> Блок ${ssrInterpolate(unref(screeningStore).currentBlock + 1)} из ${ssrInterpolate(unref(screeningStore).blocks.length)}</div><div class="questions-counter" data-v-9e809394>${ssrInterpolate(answeredQuestions.value)} / ${ssrInterpolate(unref(screeningStore).currentBlockData.questions.length)}</div></div>`);
			_push(ssrRenderComponent(_component_q_linear_progress, {
				value: unref(screeningStore).progress,
				color: "primary",
				"track-color": "grey-4",
				rounded: "",
				size: "10px"
			}, null, _parent));
			_push(`</div><div class="title-section" data-v-9e809394><div class="title" data-v-9e809394>${ssrInterpolate(unref(screeningStore).currentBlockData.title)}</div><div class="subtitle" data-v-9e809394>Оцени каждое утверждение по шкале от 1 до 5</div></div><div class="questions-list" data-v-9e809394><!--[-->`);
			ssrRenderList(unref(screeningStore).currentBlockData.questions, (question, index) => {
				_push(ssrRenderComponent(_component_q_card, {
					key: question.id,
					ref_for: true,
					ref_key: "questionRefs",
					ref: questionRefs,
					flat: "",
					class: ["question-card", { invalid: showValidation.value && unref(screeningStore).answers[question.id] === void 0 }]
				}, {
					default: withCtx((_, _push, _parent, _scopeId) => {
						if (_push) {
							_push(`<div class="question-top" data-v-9e809394${_scopeId}><div class="question-number" data-v-9e809394${_scopeId}>${ssrInterpolate(index + 1)}</div><div class="question-text" data-v-9e809394${_scopeId}>${ssrInterpolate(question.text)}</div></div><div class="answers" data-v-9e809394${_scopeId}><!--[-->`);
							ssrRenderList(5, (item) => {
								_push(`<button class="${ssrRenderClass([{ active: unref(screeningStore).answers[question.id] === item }, "answer-btn"])}" data-v-9e809394${_scopeId}>${ssrInterpolate(item)}</button>`);
							});
							_push(`<!--]--></div><div class="scale-labels" data-v-9e809394${_scopeId}><span data-v-9e809394${_scopeId}>Хорошо</span><span data-v-9e809394${_scopeId}>Плохо</span></div>`);
						} else return [
							createVNode("div", { class: "question-top" }, [createVNode("div", { class: "question-number" }, toDisplayString(index + 1), 1), createVNode("div", { class: "question-text" }, toDisplayString(question.text), 1)]),
							createVNode("div", { class: "answers" }, [(openBlock(), createBlock(Fragment, null, renderList(5, (item) => {
								return createVNode("button", {
									key: item,
									class: ["answer-btn", { active: unref(screeningStore).answers[question.id] === item }],
									onClick: ($event) => unref(screeningStore).setAnswer(question.id, item)
								}, toDisplayString(item), 11, ["onClick"]);
							}), 64))]),
							createVNode("div", { class: "scale-labels" }, [createVNode("span", null, "Хорошо"), createVNode("span", null, "Плохо")])
						];
					}),
					_: 2
				}, _parent));
			});
			_push(`<!--]--></div><div class="footer" data-v-9e809394>`);
			_push(ssrRenderComponent(_component_q_btn, {
				unelevated: "",
				"no-caps": "",
				class: "next-btn",
				label: unref(screeningStore).isLastBlock() ? "Завершить" : "Следующий блок",
				onClick: goNext
			}, null, _parent));
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/pages/questions.vue
var _sfc_setup = questions_vue_vue_type_script_setup_true_lang_default.setup;
questions_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/questions.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var questions_default = /*#__PURE__*/ _plugin_vue_export_helper_default(questions_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-9e809394"]]);

export { questions_default as default };
//# sourceMappingURL=questions-D_RT6CkF.mjs.map
