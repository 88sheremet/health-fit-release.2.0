import { e as useNuxtApp } from '../virtual/entry.mjs';
import { defineComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs } from 'vue/server-renderer';
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

//#region app/pages/test.vue?vue&type=script&setup=true&lang.ts
var test_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "test",
	__ssrInlineRender: true,
	setup(__props) {
		const { $supabase } = useNuxtApp();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(_attrs)}>Supabase Test</div>`);
		};
	}
});
//#endregion
//#region app/pages/test.vue
var _sfc_setup = test_vue_vue_type_script_setup_true_lang_default.setup;
test_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var test_default = test_vue_vue_type_script_setup_true_lang_default;

export { test_default as default };
//# sourceMappingURL=test-CngEe7EN.mjs.map
