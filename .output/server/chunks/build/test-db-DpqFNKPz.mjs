import { e as useNuxtApp } from '../virtual/entry.mjs';
import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate } from 'vue/server-renderer';
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

//#region app/composables/useSupabase.ts
var useSupabase = () => {
	const { $supabase } = useNuxtApp();
	return $supabase;
};
//#endregion
//#region app/pages/test-db.vue?vue&type=script&setup=true&lang.ts
var test_db_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "test-db",
	__ssrInlineRender: true,
	setup(__props) {
		useSupabase();
		const rows = ref([]);
		const loading = ref(true);
		const error = ref("");
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ style: { "padding": "40px" } }, _attrs))}><h1>Supabase Test</h1>`);
			if (unref(loading)) _push(`<p>Loading...</p>`);
			else if (unref(error)) _push(`<p> ❌ ${ssrInterpolate(unref(error))}</p>`);
			else _push(`<pre>${ssrInterpolate(unref(rows))}</pre>`);
			_push(`</div>`);
		};
	}
});
//#endregion
//#region app/pages/test-db.vue
var _sfc_setup = test_db_vue_vue_type_script_setup_true_lang_default.setup;
test_db_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/test-db.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var test_db_default = test_db_vue_vue_type_script_setup_true_lang_default;

export { test_db_default as default };
//# sourceMappingURL=test-db-DpqFNKPz.mjs.map
