import { _ as _plugin_vue_export_helper_default, g as useRoute$1 } from '../virtual/entry.mjs';
import { defineComponent, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass } from 'vue/server-renderer';

//#region app/components/BottomNavigation.vue?vue&type=script&setup=true&lang.ts
var BottomNavigation_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "BottomNavigation",
	__ssrInlineRender: true,
	setup(__props) {
		const route = useRoute$1();
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "bottom-nav" }, _attrs))} data-v-65ed14ae><div class="${ssrRenderClass([{ active: unref(route).path === "/daily" }, "nav-item"])}" data-v-65ed14ae><span class="material-icons" data-v-65ed14ae>task_alt</span><span class="nav-label" data-v-65ed14ae>Ежедневные<br data-v-65ed14ae>задания</span></div><div class="${ssrRenderClass([{ active: unref(route).path === "/weekly" }, "nav-item"])}" data-v-65ed14ae><span class="material-icons" data-v-65ed14ae>event_note</span><span class="nav-label" data-v-65ed14ae>Еженедельное<br data-v-65ed14ae>задание</span></div><div class="${ssrRenderClass([{ active: unref(route).path === "/journal" }, "nav-item"])}" data-v-65ed14ae><span class="material-icons" data-v-65ed14ae>menu_book</span><span class="nav-label" data-v-65ed14ae>Дневник</span></div></div>`);
		};
	}
});
//#endregion
//#region app/components/BottomNavigation.vue
var _sfc_setup = BottomNavigation_vue_vue_type_script_setup_true_lang_default.setup;
BottomNavigation_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/BottomNavigation.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var BottomNavigation_default = /*#__PURE__*/ Object.assign(_plugin_vue_export_helper_default(BottomNavigation_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-65ed14ae"]]), { __name: "BottomNavigation" });

export { BottomNavigation_default as B };
//# sourceMappingURL=BottomNavigation-DhmNMhvH.mjs.map
