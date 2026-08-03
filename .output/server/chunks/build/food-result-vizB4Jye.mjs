import { _ as _plugin_vue_export_helper_default, n as navigateTo } from '../virtual/entry.mjs';
import { r as routes } from './routes-D1jq-K_x.mjs';
import { defineComponent, mergeProps, withCtx, createVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { Q as QCard } from '../_/QCard.mjs';
import { Q as QBtn } from '../_/QBtn.mjs';
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
import '../_/render.mjs';

//#region app/pages/food-result.vue?vue&type=script&setup=true&lang.ts
var food_result_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "food-result",
	__ssrInlineRender: true,
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_card = QCard;
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "result-page" }, _attrs))} data-v-02efa15e><div class="hero" data-v-02efa15e><div class="hero-icon" data-v-02efa15e>⚡</div><div class="hero-title" data-v-02efa15e>Питание крадет твою энергию</div><div class="hero-subtitle" data-v-02efa15e> Еда не восстанавливает, а истощает тело и нервную систему </div></div>`);
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "result-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="card-title" data-v-02efa15e${_scopeId}>🥗 Главная зона риска</div><div class="card-main" data-v-02efa15e${_scopeId}>Питание и пищевые привычки</div><div class="divider" data-v-02efa15e${_scopeId}></div><div class="card-list" data-v-02efa15e${_scopeId}><div data-v-02efa15e${_scopeId}>• резкие перепады энергии в течение дня</div><div data-v-02efa15e${_scopeId}>• сильная тяга к сладкому и мучному</div><div data-v-02efa15e${_scopeId}>• переедание и питание &quot;на автомате&quot;</div><div data-v-02efa15e${_scopeId}>• постоянная нехватка воды</div><div data-v-02efa15e${_scopeId}>• тяжесть и усталость после еды</div></div>`);
					else return [
						createVNode("div", { class: "card-title" }, "🥗 Главная зона риска"),
						createVNode("div", { class: "card-main" }, "Питание и пищевые привычки"),
						createVNode("div", { class: "divider" }),
						createVNode("div", { class: "card-list" }, [
							createVNode("div", null, "• резкие перепады энергии в течение дня"),
							createVNode("div", null, "• сильная тяга к сладкому и мучному"),
							createVNode("div", null, "• переедание и питание \"на автомате\""),
							createVNode("div", null, "• постоянная нехватка воды"),
							createVNode("div", null, "• тяжесть и усталость после еды")
						])
					];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "info-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-02efa15e${_scopeId}>💪 Как это связано с физическим состоянием</div><div class="info-text" data-v-02efa15e${_scopeId}> Неправильное питание лишает тело строительных материалов. Появляется постоянная усталость, слабая выносливость, напряжение в мышцах и боли в спине/шее. </div>`);
					else return [createVNode("div", { class: "info-title" }, "💪 Как это связано с физическим состоянием"), createVNode("div", { class: "info-text" }, " Неправильное питание лишает тело строительных материалов. Появляется постоянная усталость, слабая выносливость, напряжение в мышцах и боли в спине/шее. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "info-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-02efa15e${_scopeId}>🧠 Связь с нервной системой</div><div class="info-text" data-v-02efa15e${_scopeId}> Скачки сахара и нехватка нутриентов усиливают стресс. Ухудшается сон, падает мотивация, появляется эмоциональное выгорание и прокрастинация. </div>`);
					else return [createVNode("div", { class: "info-title" }, "🧠 Связь с нервной системой"), createVNode("div", { class: "info-text" }, " Скачки сахара и нехватка нутриентов усиливают стресс. Ухудшается сон, падает мотивация, появляется эмоциональное выгорание и прокрастинация. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "recovery-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-02efa15e${_scopeId}>✨ Что восстановит все три сферы</div><div class="card-list" data-v-02efa15e${_scopeId}><div data-v-02efa15e${_scopeId}>• стабильный уровень энергии через питание</div><div data-v-02efa15e${_scopeId}>• снижение тяги к сладкому</div><div data-v-02efa15e${_scopeId}>• восстановление физических сил</div><div data-v-02efa15e${_scopeId}>• поддержка нервной системы</div></div>`);
					else return [createVNode("div", { class: "info-title" }, "✨ Что восстановит все три сферы"), createVNode("div", { class: "card-list" }, [
						createVNode("div", null, "• стабильный уровень энергии через питание"),
						createVNode("div", null, "• снижение тяги к сладкому"),
						createVNode("div", null, "• восстановление физических сил"),
						createVNode("div", null, "• поддержка нервной системы")
					])];
				}),
				_: 1
			}, _parent));
			_push(`<div class="bottom-action" data-v-02efa15e>`);
			_push(ssrRenderComponent(_component_q_btn, {
				unelevated: "",
				"no-caps": "",
				class: "main-btn",
				label: "Начать восстановление",
				onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(unref(routes).recovery.daily)
			}, null, _parent));
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/pages/food-result.vue
var _sfc_setup = food_result_vue_vue_type_script_setup_true_lang_default.setup;
food_result_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/food-result.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var food_result_default = /*#__PURE__*/ _plugin_vue_export_helper_default(food_result_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-02efa15e"]]);

export { food_result_default as default };
//# sourceMappingURL=food-result-vizB4Jye.mjs.map
