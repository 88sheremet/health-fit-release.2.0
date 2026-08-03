import { _ as _plugin_vue_export_helper_default, n as navigateTo } from '../virtual/entry.mjs';
import { r as routes } from './routes-D1jq-K_x.mjs';
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

//#region app/pages/[...slug].vue?vue&type=script&setup=true&lang.ts
var ____slug__vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "[...slug]",
	__ssrInlineRender: true,
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_btn = QBtn;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "not-found-page" }, _attrs))} data-v-b213eac9><div class="content" data-v-b213eac9><div class="code" data-v-b213eac9>404</div><div class="title" data-v-b213eac9>Страница не найдена</div><div class="subtitle" data-v-b213eac9> Возможно, ссылка устарела или страница была перемещена. </div>`);
			_push(ssrRenderComponent(_component_q_btn, {
				unelevated: "",
				"no-caps": "",
				class: "home-btn",
				label: "На главную",
				onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(unref(routes).recovery.daily)
			}, null, _parent));
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/pages/[...slug].vue
var _sfc_setup = ____slug__vue_vue_type_script_setup_true_lang_default.setup;
____slug__vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/[...slug].vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var ____slug__default = /*#__PURE__*/ _plugin_vue_export_helper_default(____slug__vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-b213eac9"]]);

export { ____slug__default as default };
//# sourceMappingURL=_...slug_-DVJF3xxk.mjs.map
