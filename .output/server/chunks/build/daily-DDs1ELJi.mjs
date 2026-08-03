import { c as createComponent, _ as _plugin_vue_export_helper_default } from '../virtual/entry.mjs';
import { m as moodOptions } from './moods-EBspplfG.mjs';
import { B as BottomNavigation_default } from './BottomNavigation-DhmNMhvH.mjs';
import { u as useTaskStore } from './dailyTasks-B7FyDFNs.mjs';
import { u as useJournalStore } from './journal-DBmNbDmQ.mjs';
import { getCurrentInstance, computed, h, defineComponent, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, withModifiers, isRef, openBlock, createBlock, Fragment, createTextVNode, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderAttr, ssrRenderClass } from 'vue/server-renderer';
import { Q as QCard } from '../_/QCard.mjs';
import { u as useSizeProps, a as useSize, Q as QBtn } from '../_/QBtn.mjs';
import { h as hMergeSlotSafely } from '../_/render.mjs';
import { Q as QDialog, a as QInput } from '../_/QInput.mjs';
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

function between(v, min, max) {
  return max <= min ? min : Math.min(max, Math.max(min, v))
}

// also used by QKnob
const useCircularCommonProps = {
  ...useSizeProps,

  min: {
    type: Number,
    default: 0
  },
  max: {
    type: Number,
    default: 100
  },

  color: String,
  centerColor: String,
  trackColor: String,

  fontSize: String,
  rounded: Boolean,

  // ratio
  thickness: {
    type: Number,
    default: 0.2,
    validator: v => v >= 0 && v <= 1
  },

  angle: {
    type: Number,
    default: 0
  },

  showValue: Boolean,
  reverse: Boolean,

  instantFeedback: Boolean
};

const radius = 50,
  diameter = 2 * radius,
  circumference = diameter * Math.PI,
  strokeDashArray = Math.round(circumference * 1000) / 1000;

const QCircularProgress = createComponent({
  name: 'QCircularProgress',

  props: {
    ...useCircularCommonProps,

    value: {
      type: Number,
      default: 0
    },

    animationSpeed: {
      type: [String, Number],
      default: 600
    },

    indeterminate: Boolean
  },

  setup(props, { slots }) {
    const {
      proxy: { $q }
    } = getCurrentInstance();
    const sizeStyle = useSize(props);

    const svgStyle = computed(() => {
      const angle = ($q.lang.rtl ? -1 : 1) * props.angle;

      return {
        transform:
          props.reverse !== ($q.lang.rtl === true)
            ? `scale3d(-1, 1, 1) rotate3d(0, 0, 1, ${ -90 - angle}deg)`
            : `rotate3d(0, 0, 1, ${angle - 90}deg)`
      }
    });

    const circleStyle = computed(() =>
      !props.instantFeedback && !props.indeterminate
        ? {
            transition: `stroke-dashoffset ${props.animationSpeed}ms ease 0s, stroke ${props.animationSpeed}ms ease`
          }
        : ''
    );

    const viewBox = computed(() => diameter / (1 - props.thickness / 2));

    const viewBoxAttr = computed(
      () =>
        `${viewBox.value / 2} ${viewBox.value / 2} ${viewBox.value} ${viewBox.value}`
    );

    const normalized = computed(() =>
      between(props.value, props.min, props.max)
    );

    const range = computed(() => props.max - props.min);
    const strokeWidth = computed(() => (props.thickness / 2) * viewBox.value);
    const strokeDashOffset = computed(() => {
      const dashRatio = (props.max - normalized.value) / range.value;
      const dashGap =
        props.rounded && normalized.value < props.max && dashRatio < 0.25
          ? (strokeWidth.value / 2) * (1 - dashRatio / 0.25)
          : 0;

      return circumference * dashRatio + dashGap
    });

    function getCircle({ thickness, offset, color, cls, rounded }) {
      return h('circle', {
        class:
          'q-circular-progress__' +
          cls +
          (color !== void 0 ? ` text-${color}` : ''),
        style: circleStyle.value,
        fill: 'transparent',
        stroke: 'currentColor',
        'stroke-width': thickness,
        'stroke-dasharray': strokeDashArray,
        'stroke-dashoffset': offset,
        'stroke-linecap': rounded,
        cx: viewBox.value,
        cy: viewBox.value,
        r: radius
      })
    }

    return () => {
      const svgChild = [];

      if (props.centerColor !== void 0 && props.centerColor !== 'transparent') {
        svgChild.push(
          h('circle', {
            class: `q-circular-progress__center text-${props.centerColor}`,
            fill: 'currentColor',
            r: radius - strokeWidth.value / 2,
            cx: viewBox.value,
            cy: viewBox.value
          })
        );
      }

      if (props.trackColor !== void 0 && props.trackColor !== 'transparent') {
        svgChild.push(
          getCircle({
            cls: 'track',
            thickness: strokeWidth.value,
            offset: 0,
            color: props.trackColor
          })
        );
      }

      svgChild.push(
        getCircle({
          cls: 'circle',
          thickness: strokeWidth.value,
          offset: strokeDashOffset.value,
          color: props.color,
          rounded: props.rounded ? 'round' : void 0
        })
      );

      const child = [
        h(
          'svg',
          {
            class: 'q-circular-progress__svg',
            style: svgStyle.value,
            viewBox: viewBoxAttr.value,
            'aria-hidden': 'true'
          },
          svgChild
        )
      ];

      if (props.showValue) {
        child.push(
          h(
            'div',
            {
              class:
                'q-circular-progress__text absolute-full row flex-center content-center',
              style: { fontSize: props.fontSize }
            },
            slots.default !== void 0
              ? slots.default()
              : [h('div', normalized.value)]
          )
        );
      }

      return h(
        'div',
        {
          class: `q-circular-progress q-circular-progress--${props.indeterminate ? 'in' : ''}determinate`,
          style: sizeStyle.value,
          role: 'progressbar',
          'aria-valuemin': props.min,
          'aria-valuemax': props.max,
          'aria-valuenow': props.indeterminate ? void 0 : normalized.value
        },
        hMergeSlotSafely(slots.internal, child)
      ) // "internal" is used by QKnob
    }
  }
});

//#region app/components/TaskDetailsDialog.vue?vue&type=script&setup=true&lang.ts
var TaskDetailsDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "TaskDetailsDialog",
	__ssrInlineRender: true,
	props: {
		modelValue: Boolean,
		task: Object
	},
	emits: ["update:modelValue"],
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(QDialog, mergeProps({
				"model-value": __props.modelValue,
				"onUpdate:modelValue": ($event) => _ctx.$emit("update:modelValue", $event)
			}, _attrs), {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="dialog" data-v-d4b48715${_scopeId}><div class="header" data-v-d4b48715${_scopeId}><button class="close-btn" data-v-d4b48715${_scopeId}><span class="material-icons" data-v-d4b48715${_scopeId}>close</span></button><div class="title" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.title)}</div><span class="reward-chip" data-v-d4b48715${_scopeId}>+${ssrInterpolate(__props.task?.reward)} энергии</span></div><hr class="separator" data-v-d4b48715${_scopeId}><div class="content" data-v-d4b48715${_scopeId}><div class="section-title" data-v-d4b48715${_scopeId}>Что делать</div>`);
						if (__props.task?.type !== "physical") _push(`<div class="text" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.whatDoing)}</div>`);
						else _push(`<!--[--><div class="exercise-block" data-v-d4b48715${_scopeId}><div class="exercise-title" data-v-d4b48715${_scopeId}>Спина</div><div class="text" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.whatDoing?.back)}</div></div><div class="exercise-block" data-v-d4b48715${_scopeId}><div class="exercise-title" data-v-d4b48715${_scopeId}>Ноги</div><div class="text" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.whatDoing?.legs)}</div></div><div class="exercise-block" data-v-d4b48715${_scopeId}><div class="exercise-title" data-v-d4b48715${_scopeId}>Пресс</div><div class="text" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.whatDoing?.abs)}</div></div><!--]-->`);
						_push(`<hr class="separator" data-v-d4b48715${_scopeId}><div class="section-title" data-v-d4b48715${_scopeId}>Зачем делать</div><div class="text" data-v-d4b48715${_scopeId}>${ssrInterpolate(__props.task?.whyDoing)}</div></div></div>`);
					} else return [createVNode("div", { class: "dialog" }, [
						createVNode("div", { class: "header" }, [
							createVNode("button", {
								class: "close-btn",
								onClick: ($event) => _ctx.$emit("update:modelValue", false)
							}, [createVNode("span", { class: "material-icons" }, "close")], 8, ["onClick"]),
							createVNode("div", { class: "title" }, toDisplayString(__props.task?.title), 1),
							createVNode("span", { class: "reward-chip" }, "+" + toDisplayString(__props.task?.reward) + " энергии", 1)
						]),
						createVNode("hr", { class: "separator" }),
						createVNode("div", { class: "content" }, [
							createVNode("div", { class: "section-title" }, "Что делать"),
							__props.task?.type !== "physical" ? (openBlock(), createBlock("div", {
								key: 0,
								class: "text"
							}, toDisplayString(__props.task?.whatDoing), 1)) : (openBlock(), createBlock(Fragment, { key: 1 }, [
								createVNode("div", { class: "exercise-block" }, [createVNode("div", { class: "exercise-title" }, "Спина"), createVNode("div", { class: "text" }, toDisplayString(__props.task?.whatDoing?.back), 1)]),
								createVNode("div", { class: "exercise-block" }, [createVNode("div", { class: "exercise-title" }, "Ноги"), createVNode("div", { class: "text" }, toDisplayString(__props.task?.whatDoing?.legs), 1)]),
								createVNode("div", { class: "exercise-block" }, [createVNode("div", { class: "exercise-title" }, "Пресс"), createVNode("div", { class: "text" }, toDisplayString(__props.task?.whatDoing?.abs), 1)])
							], 64)),
							createVNode("hr", { class: "separator" }),
							createVNode("div", { class: "section-title" }, "Зачем делать"),
							createVNode("div", { class: "text" }, toDisplayString(__props.task?.whyDoing), 1)
						])
					])];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region app/components/TaskDetailsDialog.vue
var _sfc_setup$2 = TaskDetailsDialog_vue_vue_type_script_setup_true_lang_default.setup;
TaskDetailsDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TaskDetailsDialog.vue");
	return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var TaskDetailsDialog_default = /*#__PURE__*/ Object.assign(_plugin_vue_export_helper_default(TaskDetailsDialog_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d4b48715"]]), { __name: "TaskDetailsDialog" });
//#endregion
//#region app/components/CheckInDialog.vue?vue&type=script&setup=true&lang.ts
var CheckInDialog_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "CheckInDialog",
	__ssrInlineRender: true,
	props: { modelValue: Boolean },
	emits: ["update:modelValue", "save"],
	setup(__props, { emit: __emit }) {
		const emit = __emit;
		const note = ref("");
		const mood = ref(null);
		const moods = moodOptions;
		function save() {
			emit("save", {
				mood: mood.value,
				note: note.value,
				date: (/* @__PURE__ */ new Date()).toISOString()
			});
			emit("update:modelValue", false);
			mood.value = null;
			note.value = "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_dialog = QDialog;
			const _component_q_card = QCard;
			const _component_q_input = QInput;
			const _component_q_btn = QBtn;
			_push(ssrRenderComponent(_component_q_dialog, mergeProps({
				"model-value": __props.modelValue,
				persistent: "",
				"onUpdate:modelValue": ($event) => _ctx.$emit("update:modelValue", $event)
			}, _attrs), {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(ssrRenderComponent(_component_q_card, { class: "checkin-card" }, {
						default: withCtx((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<div class="hero"${_scopeId}><div class="title"${_scopeId}> Давай зафиксируем <br${_scopeId}> свое состояние </div><div class="subtitle"${_scopeId}>Это займет меньше минуты</div></div><div class="section-title"${_scopeId}>Как ты себя чувствуешь?</div><div class="moods"${_scopeId}><!--[-->`);
								ssrRenderList(unref(moods), (item) => {
									_push(`<button class="${ssrRenderClass([{ active: mood.value === item.value }, "mood-btn"])}"${_scopeId}><div class="emoji"${_scopeId}>${ssrInterpolate(item.emoji)}</div><div class="emoji-label"${_scopeId}>${ssrInterpolate(item.label)}</div></button>`);
								});
								_push(`<!--]--></div><div class="section-title"${_scopeId}>Опиши свое состояние</div>`);
								_push(ssrRenderComponent(_component_q_input, {
									modelValue: note.value,
									"onUpdate:modelValue": ($event) => note.value = $event,
									type: "textarea",
									autogrow: "",
									outlined: "",
									class: "note-input",
									placeholder: "Например: устал, нет энергии, тревога, много мыслей..."
								}, null, _parent, _scopeId));
								_push(`<div class="tip-card"${_scopeId}><div class="tip-title"${_scopeId}>📈 Зачем это нужно?</div><div class="tip-text"${_scopeId}> Мы будем строить график состояния и показывать, как меняется твое самочувствие день за днем. </div></div>`);
								_push(ssrRenderComponent(_component_q_btn, {
									unelevated: "",
									"no-caps": "",
									color: "primary",
									"text-color": "white",
									class: "save-btn",
									label: "Зафиксировать",
									disable: !mood.value,
									onClick: save
								}, null, _parent, _scopeId));
							} else return [
								createVNode("div", { class: "hero" }, [createVNode("div", { class: "title" }, [
									createTextVNode(" Давай зафиксируем "),
									createVNode("br"),
									createTextVNode(" свое состояние ")
								]), createVNode("div", { class: "subtitle" }, "Это займет меньше минуты")]),
								createVNode("div", { class: "section-title" }, "Как ты себя чувствуешь?"),
								createVNode("div", { class: "moods" }, [(openBlock(true), createBlock(Fragment, null, renderList(unref(moods), (item) => {
									return openBlock(), createBlock("button", {
										key: item.value,
										class: ["mood-btn", { active: mood.value === item.value }],
										onClick: ($event) => mood.value = item.value
									}, [createVNode("div", { class: "emoji" }, toDisplayString(item.emoji), 1), createVNode("div", { class: "emoji-label" }, toDisplayString(item.label), 1)], 10, ["onClick"]);
								}), 128))]),
								createVNode("div", { class: "section-title" }, "Опиши свое состояние"),
								createVNode(_component_q_input, {
									modelValue: note.value,
									"onUpdate:modelValue": ($event) => note.value = $event,
									type: "textarea",
									autogrow: "",
									outlined: "",
									class: "note-input",
									placeholder: "Например: устал, нет энергии, тревога, много мыслей..."
								}, null, 8, ["modelValue", "onUpdate:modelValue"]),
								createVNode("div", { class: "tip-card" }, [createVNode("div", { class: "tip-title" }, "📈 Зачем это нужно?"), createVNode("div", { class: "tip-text" }, " Мы будем строить график состояния и показывать, как меняется твое самочувствие день за днем. ")]),
								createVNode(_component_q_btn, {
									unelevated: "",
									"no-caps": "",
									color: "primary",
									"text-color": "white",
									class: "save-btn",
									label: "Зафиксировать",
									disable: !mood.value,
									onClick: save
								}, null, 8, ["disable"])
							];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [createVNode(_component_q_card, { class: "checkin-card" }, {
						default: withCtx(() => [
							createVNode("div", { class: "hero" }, [createVNode("div", { class: "title" }, [
								createTextVNode(" Давай зафиксируем "),
								createVNode("br"),
								createTextVNode(" свое состояние ")
							]), createVNode("div", { class: "subtitle" }, "Это займет меньше минуты")]),
							createVNode("div", { class: "section-title" }, "Как ты себя чувствуешь?"),
							createVNode("div", { class: "moods" }, [(openBlock(true), createBlock(Fragment, null, renderList(unref(moods), (item) => {
								return openBlock(), createBlock("button", {
									key: item.value,
									class: ["mood-btn", { active: mood.value === item.value }],
									onClick: ($event) => mood.value = item.value
								}, [createVNode("div", { class: "emoji" }, toDisplayString(item.emoji), 1), createVNode("div", { class: "emoji-label" }, toDisplayString(item.label), 1)], 10, ["onClick"]);
							}), 128))]),
							createVNode("div", { class: "section-title" }, "Опиши свое состояние"),
							createVNode(_component_q_input, {
								modelValue: note.value,
								"onUpdate:modelValue": ($event) => note.value = $event,
								type: "textarea",
								autogrow: "",
								outlined: "",
								class: "note-input",
								placeholder: "Например: устал, нет энергии, тревога, много мыслей..."
							}, null, 8, ["modelValue", "onUpdate:modelValue"]),
							createVNode("div", { class: "tip-card" }, [createVNode("div", { class: "tip-title" }, "📈 Зачем это нужно?"), createVNode("div", { class: "tip-text" }, " Мы будем строить график состояния и показывать, как меняется твое самочувствие день за днем. ")]),
							createVNode(_component_q_btn, {
								unelevated: "",
								"no-caps": "",
								color: "primary",
								"text-color": "white",
								class: "save-btn",
								label: "Зафиксировать",
								disable: !mood.value,
								onClick: save
							}, null, 8, ["disable"])
						]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
		};
	}
});
//#endregion
//#region app/components/CheckInDialog.vue
var _sfc_setup$1 = CheckInDialog_vue_vue_type_script_setup_true_lang_default.setup;
CheckInDialog_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CheckInDialog.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var CheckInDialog_default = Object.assign(CheckInDialog_vue_vue_type_script_setup_true_lang_default, { __name: "CheckInDialog" });
//#endregion
//#region app/assets/click.png
var click_default = "" + __buildAssetsURL("click.DDyMVgO3.png");
//#endregion
//#region app/pages/daily.vue?vue&type=script&setup=true&lang.ts
var daily_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "daily",
	__ssrInlineRender: true,
	setup(__props) {
		const store = useTaskStore();
		const journalStore = useJournalStore();
		const tasks = computed(() => store.todayTasks);
		const selectedTask = ref(null);
		const showDialog = ref(false);
		function openTask(task) {
			selectedTask.value = task;
			showDialog.value = true;
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_card = QCard;
			const _component_q_circular_progress = QCircularProgress;
			const _component_q_btn = QBtn;
			const _component_TaskDetailsDialog = TaskDetailsDialog_default;
			const _component_CheckInDialog = CheckInDialog_default;
			const _component_BottomNavigation = BottomNavigation_default;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "page" }, _attrs))} data-v-4cfd9e21><div class="header" data-v-4cfd9e21><div data-v-4cfd9e21><div class="title" data-v-4cfd9e21>Привет 👋</div><div class="subtitle" data-v-4cfd9e21>День ${ssrInterpolate(unref(store).dayIndex)}</div></div><div class="streak-avatar" data-v-4cfd9e21>${ssrInterpolate(unref(store).streak)}</div></div>`);
			_push(ssrRenderComponent(_component_q_card, { class: "energy-card" }, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) {
						_push(`<div class="energy-row" data-v-4cfd9e21${_scopeId}><div data-v-4cfd9e21${_scopeId}><div class="label" data-v-4cfd9e21${_scopeId}>Энергия</div><div class="value" data-v-4cfd9e21${_scopeId}>${ssrInterpolate(unref(store).energy)} ⚡</div></div>`);
						_push(ssrRenderComponent(_component_q_circular_progress, {
							value: unref(store).energy,
							max: 1e3,
							size: "60px",
							color: "primary",
							"track-color": "grey-4",
							thickness: .1
						}, null, _parent, _scopeId));
						_push(`</div>`);
					} else return [createVNode("div", { class: "energy-row" }, [createVNode("div", null, [createVNode("div", { class: "label" }, "Энергия"), createVNode("div", { class: "value" }, toDisplayString(unref(store).energy) + " ⚡", 1)]), createVNode(_component_q_circular_progress, {
						value: unref(store).energy,
						max: 1e3,
						size: "60px",
						color: "primary",
						"track-color": "grey-4",
						thickness: .1
					}, null, 8, ["value"])])];
				}),
				_: 1
			}, _parent));
			if (unref(store).isRestDay) _push(`<div class="rest-card" data-v-4cfd9e21><div class="emoji" data-v-4cfd9e21>🌿</div><div class="rest-title" data-v-4cfd9e21>Сегодня полный отдых</div><div class="rest-text" data-v-4cfd9e21>Восстановление — это тоже прогресс</div></div>`);
			else {
				_push(`<div class="tasks" data-v-4cfd9e21><!--[-->`);
				ssrRenderList(unref(tasks), (task) => {
					_push(ssrRenderComponent(_component_q_card, {
						key: task.id,
						class: "task-card",
						onClick: ($event) => openTask(task)
					}, {
						default: withCtx((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<div class="task-header" data-v-4cfd9e21${_scopeId}><div class="task-title" data-v-4cfd9e21${_scopeId}>${ssrInterpolate(task.title)}</div><button class="icon-popup" data-v-4cfd9e21${_scopeId}><img${ssrRenderAttr("src", unref(click_default))} class="click-icon" data-v-4cfd9e21${_scopeId}></button></div><div class="task-footer" data-v-4cfd9e21${_scopeId}><div class="reward" data-v-4cfd9e21${_scopeId}>+${ssrInterpolate(task.reward)} ресурса</div>`);
								_push(ssrRenderComponent(_component_q_btn, {
									class: "select-btn",
									dense: "",
									"no-caps": "",
									unelevated: "",
									color: "primary",
									"text-color": "white",
									label: unref(store).isDone(task.id) ? "Готово" : "Выполнить",
									disable: unref(store).isDone(task.id),
									onClick: ($event) => unref(store).completeTask(task)
								}, null, _parent, _scopeId));
								_push(`</div>`);
							} else return [createVNode("div", { class: "task-header" }, [createVNode("div", { class: "task-title" }, toDisplayString(task.title), 1), createVNode("button", {
								class: "icon-popup",
								onClick: withModifiers(($event) => openTask(task), ["stop"])
							}, [createVNode("img", {
								src: unref(click_default),
								class: "click-icon"
							}, null, 8, ["src"])], 8, ["onClick"])]), createVNode("div", { class: "task-footer" }, [createVNode("div", { class: "reward" }, "+" + toDisplayString(task.reward) + " ресурса", 1), createVNode(_component_q_btn, {
								class: "select-btn",
								dense: "",
								"no-caps": "",
								unelevated: "",
								color: "primary",
								"text-color": "white",
								label: unref(store).isDone(task.id) ? "Готово" : "Выполнить",
								disable: unref(store).isDone(task.id),
								onClick: withModifiers(($event) => unref(store).completeTask(task), ["stop"])
							}, null, 8, [
								"label",
								"disable",
								"onClick"
							])])];
						}),
						_: 2
					}, _parent));
				});
				_push(`<!--]--></div>`);
			}
			_push(ssrRenderComponent(_component_TaskDetailsDialog, {
				modelValue: unref(showDialog),
				"onUpdate:modelValue": ($event) => isRef(showDialog) ? showDialog.value = $event : null,
				task: unref(selectedTask)
			}, null, _parent));
			_push(ssrRenderComponent(_component_CheckInDialog, {
				modelValue: unref(journalStore).showCheckin,
				"onUpdate:modelValue": ($event) => unref(journalStore).showCheckin = $event,
				onSave: unref(journalStore).saveCheckin
			}, null, _parent));
			_push(ssrRenderComponent(_component_BottomNavigation, null, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region app/pages/daily.vue
var _sfc_setup = daily_vue_vue_type_script_setup_true_lang_default.setup;
daily_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/daily.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var daily_default = /*#__PURE__*/ _plugin_vue_export_helper_default(daily_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-4cfd9e21"]]);

export { daily_default as default };
//# sourceMappingURL=daily-DDs1ELJi.mjs.map
