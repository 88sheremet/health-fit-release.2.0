import { _ as _plugin_vue_export_helper_default, u as useQuasar, n as navigateTo } from '../virtual/entry.mjs';
import { r as routes } from './routes-D1jq-K_x.mjs';
import { u as useScreeningStore } from './screening-DvSbJSAX.mjs';
import { defineComponent, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
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

//#region app/pages/menu.vue?vue&type=script&setup=true&lang.ts
var menu_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "menu",
	__ssrInlineRender: true,
	setup(__props) {
		useQuasar();
		const screeningStore = useScreeningStore();
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "menu-page" }, _attrs))} data-v-d1d2c2c8><div class="header" data-v-d1d2c2c8><div class="title" data-v-d1d2c2c8>Главное меню</div><div class="subtitle" data-v-d1d2c2c8>Твои инструменты восстановления и развития</div>`);
			if (!unref(screeningStore).screeningCompleted) _push(ssrRenderComponent(_component_q_btn, {
				unelevated: "",
				"no-caps": "",
				class: "test-btn",
				label: "Пройти анализ состояния",
				onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(unref(routes).onboarding.questions)
			}, null, _parent));
			else _push(`<!---->`);
			_push(`</div><div class="tabs" data-v-d1d2c2c8><div class="tab-card" data-v-d1d2c2c8><span class="material-icons tab-icon" data-v-d1d2c2c8>task_alt</span><div class="tab-title" data-v-d1d2c2c8>Ежедневные задания</div><div class="tab-text" data-v-d1d2c2c8>Маленькие шаги каждый день</div></div><div class="tab-card" data-v-d1d2c2c8><span class="material-icons tab-icon" data-v-d1d2c2c8>event_note</span><div class="tab-title" data-v-d1d2c2c8>Еженедельное задание</div><div class="tab-text" data-v-d1d2c2c8>Глубокая работа над собой</div></div><div class="tab-card" data-v-d1d2c2c8><span class="material-icons tab-icon" data-v-d1d2c2c8>menu_book</span><div class="tab-title" data-v-d1d2c2c8>Дневник</div><div class="tab-text" data-v-d1d2c2c8>Отслеживай состояние и прогресс</div></div></div></div>`);
		};
	}
});
//#endregion
//#region app/pages/menu.vue
var _sfc_setup = menu_vue_vue_type_script_setup_true_lang_default.setup;
menu_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/menu.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var menu_default = /*#__PURE__*/ _plugin_vue_export_helper_default(menu_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-d1d2c2c8"]]);

export { menu_default as default };
//# sourceMappingURL=menu-CPdD2JQt.mjs.map
