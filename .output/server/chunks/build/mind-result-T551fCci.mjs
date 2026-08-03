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

//#region app/pages/mind-result.vue?vue&type=script&setup=true&lang.ts
var mind_result_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "mind-result",
	__ssrInlineRender: true,
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_card = QCard;
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "result-page" }, _attrs))} data-v-6dde26f1><div class="hero" data-v-6dde26f1><div class="hero-icon" data-v-6dde26f1>🧠</div><div class="hero-title" data-v-6dde26f1>Твоя нервная система на пределе</div><div class="hero-subtitle" data-v-6dde26f1> Хронический стресс разрушает тело и питание </div></div>`);
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "result-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="card-title" data-v-6dde26f1${_scopeId}>⚡ Главная зона риска</div><div class="card-main" data-v-6dde26f1${_scopeId}>Психологическое состояние</div><div class="divider" data-v-6dde26f1${_scopeId}></div><div class="card-list" data-v-6dde26f1${_scopeId}><div data-v-6dde26f1${_scopeId}>• высокий уровень стресса</div><div data-v-6dde26f1${_scopeId}>• эмоциональное выгорание</div><div data-v-6dde26f1${_scopeId}>• проблемы со сном</div><div data-v-6dde26f1${_scopeId}>• полное отсутствие сил</div><div data-v-6dde26f1${_scopeId}>• прокрастинация и потеря дисциплины</div></div>`);
					else return [
						createVNode("div", { class: "card-title" }, "⚡ Главная зона риска"),
						createVNode("div", { class: "card-main" }, "Психологическое состояние"),
						createVNode("div", { class: "divider" }),
						createVNode("div", { class: "card-list" }, [
							createVNode("div", null, "• высокий уровень стресса"),
							createVNode("div", null, "• эмоциональное выгорание"),
							createVNode("div", null, "• проблемы со сном"),
							createVNode("div", null, "• полное отсутствие сил"),
							createVNode("div", null, "• прокрастинация и потеря дисциплины")
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
					if (_push) _push(`<div class="info-title" data-v-6dde26f1${_scopeId}>💪 Как это связано с физическим состоянием</div><div class="info-text" data-v-6dde26f1${_scopeId}> Постоянный стресс держит мышцы в напряжении. Появляются боли в спине и шее, хроническая усталость, слабая выносливость и ощущение &quot;разбитости&quot; с утра. </div>`);
					else return [createVNode("div", { class: "info-title" }, "💪 Как это связано с физическим состоянием"), createVNode("div", { class: "info-text" }, " Постоянный стресс держит мышцы в напряжении. Появляются боли в спине и шее, хроническая усталость, слабая выносливость и ощущение \"разбитости\" с утра. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "info-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-6dde26f1${_scopeId}>🍽️ Связь с питанием</div><div class="info-text" data-v-6dde26f1${_scopeId}> Стресс запускает тягу к сладкому и переедание. Возникают резкие перепады энергии, питание &quot;на автомате&quot; и усталость после еды. </div>`);
					else return [createVNode("div", { class: "info-title" }, "🍽️ Связь с питанием"), createVNode("div", { class: "info-text" }, " Стресс запускает тягу к сладкому и переедание. Возникают резкие перепады энергии, питание \"на автомате\" и усталость после еды. ")];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "recovery-card"
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="info-title" data-v-6dde26f1${_scopeId}>✨ Что восстановит все три сферы</div><div class="card-list" data-v-6dde26f1${_scopeId}><div data-v-6dde26f1${_scopeId}>• снижение уровня стресса</div><div data-v-6dde26f1${_scopeId}>• восстановление сна и энергии</div><div data-v-6dde26f1${_scopeId}>• расслабление физического тела</div><div data-v-6dde26f1${_scopeId}>• стабильное питание без скачков</div></div>`);
					else return [createVNode("div", { class: "info-title" }, "✨ Что восстановит все три сферы"), createVNode("div", { class: "card-list" }, [
						createVNode("div", null, "• снижение уровня стресса"),
						createVNode("div", null, "• восстановление сна и энергии"),
						createVNode("div", null, "• расслабление физического тела"),
						createVNode("div", null, "• стабильное питание без скачков")
					])];
				}),
				_: 1
			}, _parent));
			_push(`<div class="bottom-action" data-v-6dde26f1>`);
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
//#region app/pages/mind-result.vue
var _sfc_setup = mind_result_vue_vue_type_script_setup_true_lang_default.setup;
mind_result_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/mind-result.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var mind_result_default = /*#__PURE__*/ _plugin_vue_export_helper_default(mind_result_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-6dde26f1"]]);

export { mind_result_default as default };
//# sourceMappingURL=mind-result-T551fCci.mjs.map
