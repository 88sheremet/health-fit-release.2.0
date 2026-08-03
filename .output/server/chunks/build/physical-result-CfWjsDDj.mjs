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

//#region app/pages/physical-result.vue?vue&type=script&setup=true&lang.ts
var physical_result_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "physical-result",
	__ssrInlineRender: true,
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_card = QCard;
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "result-page physical" }, _attrs))} data-v-a8791d30><div class="hero" data-v-a8791d30><div class="hero-icon" data-v-a8791d30>⚠️</div><div class="hero-title" data-v-a8791d30>Твое тело работает на износ</div><div class="hero-subtitle" data-v-a8791d30> Физическая перегрузка разрушает энергию, питание и нервы </div></div>`);
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "result-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="card-title" data-v-a8791d30${_scopeId}>🔥 Главная зона риска</div><div class="card-main" data-v-a8791d30${_scopeId}>Физическое состояние</div><div class="divider" data-v-a8791d30${_scopeId}></div><div class="card-list" data-v-a8791d30${_scopeId}><div data-v-a8791d30${_scopeId}>• постоянная усталость и &quot;разбитость&quot;</div><div data-v-a8791d30${_scopeId}>• низкая выносливость</div><div data-v-a8791d30${_scopeId}>• напряжение и боли в спине/шее</div><div data-v-a8791d30${_scopeId}>• организм не успевает восстанавливаться</div><div data-v-a8791d30${_scopeId}>• нехватка энергии с самого утра</div></div>`);
					else return [
						createVNode("div", { class: "card-title" }, "🔥 Главная зона риска"),
						createVNode("div", { class: "card-main" }, "Физическое состояние"),
						createVNode("div", { class: "divider" }),
						createVNode("div", { class: "card-list" }, [
							createVNode("div", null, "• постоянная усталость и \"разбитость\""),
							createVNode("div", null, "• низкая выносливость"),
							createVNode("div", null, "• напряжение и боли в спине/шее"),
							createVNode("div", null, "• организм не успевает восстанавливаться"),
							createVNode("div", null, "• нехватка энергии с самого утра")
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
					if (_push) _push(`<div class="info-title" data-v-a8791d30${_scopeId}>🍽️ Как это связано с питанием</div><div class="info-text" data-v-a8791d30${_scopeId}> Из-за физической перегрузки организм требует быстрых углеводов. Появляется тяга к сладкому, переедание, резкие скачки энергии и усталость после еды. </div>`);
					else return [createVNode("div", { class: "info-title" }, "🍽️ Как это связано с питанием"), createVNode("div", { class: "info-text" }, " Из-за физической перегрузки организм требует быстрых углеводов. Появляется тяга к сладкому, переедание, резкие скачки энергии и усталость после еды. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "info-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-a8791d30${_scopeId}>🧠 Связь с нервной системой</div><div class="info-text" data-v-a8791d30${_scopeId}> Физическое истощение усиливает стресс. Нарушается сон, падает мотивация, появляется прокрастинация и эмоциональное выгорание. </div>`);
					else return [createVNode("div", { class: "info-title" }, "🧠 Связь с нервной системой"), createVNode("div", { class: "info-text" }, " Физическое истощение усиливает стресс. Нарушается сон, падает мотивация, появляется прокрастинация и эмоциональное выгорание. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "recovery-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-a8791d30${_scopeId}>✨ Что восстановит все три сферы</div><div class="card-list" data-v-a8791d30${_scopeId}><div data-v-a8791d30${_scopeId}>• мягкая физическая активность</div><div data-v-a8791d30${_scopeId}>• восстановление энергии через питание</div><div data-v-a8791d30${_scopeId}>• снижение физической и нервной перегрузки</div><div data-v-a8791d30${_scopeId}>• улучшение мобильности тела</div></div>`);
					else return [createVNode("div", { class: "info-title" }, "✨ Что восстановит все три сферы"), createVNode("div", { class: "card-list" }, [
						createVNode("div", null, "• мягкая физическая активность"),
						createVNode("div", null, "• восстановление энергии через питание"),
						createVNode("div", null, "• снижение физической и нервной перегрузки"),
						createVNode("div", null, "• улучшение мобильности тела")
					])];
				}),
				_: 1
			}, _parent));
			_push(`<div class="bottom-action" data-v-a8791d30>`);
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
//#region app/pages/physical-result.vue
var _sfc_setup = physical_result_vue_vue_type_script_setup_true_lang_default.setup;
physical_result_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/physical-result.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var physical_result_default = /*#__PURE__*/ _plugin_vue_export_helper_default(physical_result_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-a8791d30"]]);

export { physical_result_default as default };
//# sourceMappingURL=physical-result-CfWjsDDj.mjs.map
