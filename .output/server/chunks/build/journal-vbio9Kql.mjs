import { _ as _plugin_vue_export_helper_default, n as navigateTo } from '../virtual/entry.mjs';
import { r as routes } from './routes-D1jq-K_x.mjs';
import { B as BottomNavigation_default } from './BottomNavigation-DhmNMhvH.mjs';
import { u as useJournalStore } from './journal-DBmNbDmQ.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent } from 'vue/server-renderer';
import { Q as QCard } from '../_/QCard.mjs';
import { Q as QDialog, a as QInput } from '../_/QInput.mjs';
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

//#region app/pages/journal.vue?vue&type=script&setup=true&lang.ts
var journal_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "journal",
	__ssrInlineRender: true,
	setup(__props) {
		const journalStore = useJournalStore();
		const showNoteDialog = ref(false);
		const note = ref("");
		function saveNote() {
			if (!note.value.trim()) return;
			journalStore.addNote(note.value);
			showNoteDialog.value = false;
			note.value = "";
		}
		return (_ctx, _push, _parent, _attrs) => {
			const _component_q_card = QCard;
			const _component_q_dialog = QDialog;
			const _component_q_input = QInput;
			const _component_q_btn = QBtn;
			const _component_BottomNavigation = BottomNavigation_default;
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "journal-page" }, _attrs))} data-v-f14e01fe><section class="hero" data-v-f14e01fe><div class="hero-content" data-v-f14e01fe><h1 class="hero-title" data-v-f14e01fe>Дневник</h1><p class="hero-subtitle" data-v-f14e01fe> Фиксируй свои мысли и состояние, чтобы видеть изменения со временем </p></div><div class="hero-book" data-v-f14e01fe><span class="material-icons book-icon" data-v-f14e01fe>menu_book</span></div></section><div class="actions" data-v-f14e01fe>`);
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "action-card",
				onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))("/journal-chart")
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="action-icon green-bg" data-v-f14e01fe${_scopeId}><span class="material-icons icon-green" data-v-f14e01fe${_scopeId}>show_chart</span></div><div class="action-content" data-v-f14e01fe${_scopeId}><div class="action-title" data-v-f14e01fe${_scopeId}>Смотреть график</div><div class="action-subtitle" data-v-f14e01fe${_scopeId}>Посмотри динамику своего состояния</div></div><span class="material-icons icon-green" data-v-f14e01fe${_scopeId}>chevron_right</span>`);
					else return [
						createVNode("div", { class: "action-icon green-bg" }, [createVNode("span", { class: "material-icons icon-green" }, "show_chart")]),
						createVNode("div", { class: "action-content" }, [createVNode("div", { class: "action-title" }, "Смотреть график"), createVNode("div", { class: "action-subtitle" }, "Посмотри динамику своего состояния")]),
						createVNode("span", { class: "material-icons icon-green" }, "chevron_right")
					];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "action-card note-card",
				onClick: ($event) => showNoteDialog.value = true
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="action-icon orange-bg" data-v-f14e01fe${_scopeId}><span class="material-icons icon-orange" data-v-f14e01fe${_scopeId}>edit</span></div><div class="action-content" data-v-f14e01fe${_scopeId}><div class="action-title" data-v-f14e01fe${_scopeId}>Сделать заметку</div><div class="action-subtitle" data-v-f14e01fe${_scopeId}>Запиши свои мысли или наблюдения</div></div><div class="plus-circle" data-v-f14e01fe${_scopeId}><span class="material-icons icon-orange" data-v-f14e01fe${_scopeId}>add</span></div>`);
					else return [
						createVNode("div", { class: "action-icon orange-bg" }, [createVNode("span", { class: "material-icons icon-orange" }, "edit")]),
						createVNode("div", { class: "action-content" }, [createVNode("div", { class: "action-title" }, "Сделать заметку"), createVNode("div", { class: "action-subtitle" }, "Запиши свои мысли или наблюдения")]),
						createVNode("div", { class: "plus-circle" }, [createVNode("span", { class: "material-icons icon-orange" }, "add")])
					];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_q_card, {
				flat: "",
				class: "action-card",
				onClick: ($event) => ("navigateTo" in _ctx ? _ctx.navigateTo : unref(navigateTo))(unref(routes).recovery.journalArchive)
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(`<div class="action-icon blue-bg" data-v-f14e01fe${_scopeId}><span class="material-icons icon-blue" data-v-f14e01fe${_scopeId}>inventory_2</span></div><div class="action-content" data-v-f14e01fe${_scopeId}><div class="action-title" data-v-f14e01fe${_scopeId}>Архив</div><div class="action-subtitle" data-v-f14e01fe${_scopeId}>Просмотри сохраненные записи</div></div><span class="material-icons icon-blue" data-v-f14e01fe${_scopeId}>chevron_right</span>`);
					else return [
						createVNode("div", { class: "action-icon blue-bg" }, [createVNode("span", { class: "material-icons icon-blue" }, "inventory_2")]),
						createVNode("div", { class: "action-content" }, [createVNode("div", { class: "action-title" }, "Архив"), createVNode("div", { class: "action-subtitle" }, "Просмотри сохраненные записи")]),
						createVNode("span", { class: "material-icons icon-blue" }, "chevron_right")
					];
				}),
				_: 1
			}, _parent));
			_push(`</div>`);
			_push(ssrRenderComponent(_component_q_dialog, {
				modelValue: showNoteDialog.value,
				"onUpdate:modelValue": ($event) => showNoteDialog.value = $event
			}, {
				default: withCtx((_, _push, _parent, _scopeId) => {
					if (_push) _push(ssrRenderComponent(_component_q_card, { class: "dialog-card" }, {
						default: withCtx((_, _push, _parent, _scopeId) => {
							if (_push) {
								_push(`<div class="dialog-title" data-v-f14e01fe${_scopeId}>Новая заметка</div>`);
								_push(ssrRenderComponent(_component_q_input, {
									modelValue: note.value,
									"onUpdate:modelValue": ($event) => note.value = $event,
									type: "textarea",
									autogrow: "",
									outlined: "",
									placeholder: "Напишите свои мысли или наблюдения..."
								}, null, _parent, _scopeId));
								_push(`<div class="dialog-actions" data-v-f14e01fe${_scopeId}>`);
								_push(ssrRenderComponent(_component_q_btn, {
									flat: "",
									"no-caps": "",
									"text-color": "primary",
									label: "Отмена",
									onClick: ($event) => showNoteDialog.value = false
								}, null, _parent, _scopeId));
								_push(ssrRenderComponent(_component_q_btn, {
									unelevated: "",
									"no-caps": "",
									color: "primary",
									label: "Сохранить",
									onClick: saveNote
								}, null, _parent, _scopeId));
								_push(`</div>`);
							} else return [
								createVNode("div", { class: "dialog-title" }, "Новая заметка"),
								createVNode(_component_q_input, {
									modelValue: note.value,
									"onUpdate:modelValue": ($event) => note.value = $event,
									type: "textarea",
									autogrow: "",
									outlined: "",
									placeholder: "Напишите свои мысли или наблюдения..."
								}, null, 8, ["modelValue", "onUpdate:modelValue"]),
								createVNode("div", { class: "dialog-actions" }, [createVNode(_component_q_btn, {
									flat: "",
									"no-caps": "",
									"text-color": "primary",
									label: "Отмена",
									onClick: ($event) => showNoteDialog.value = false
								}, null, 8, ["onClick"]), createVNode(_component_q_btn, {
									unelevated: "",
									"no-caps": "",
									color: "primary",
									label: "Сохранить",
									onClick: saveNote
								})])
							];
						}),
						_: 1
					}, _parent, _scopeId));
					else return [createVNode(_component_q_card, { class: "dialog-card" }, {
						default: withCtx(() => [
							createVNode("div", { class: "dialog-title" }, "Новая заметка"),
							createVNode(_component_q_input, {
								modelValue: note.value,
								"onUpdate:modelValue": ($event) => note.value = $event,
								type: "textarea",
								autogrow: "",
								outlined: "",
								placeholder: "Напишите свои мысли или наблюдения..."
							}, null, 8, ["modelValue", "onUpdate:modelValue"]),
							createVNode("div", { class: "dialog-actions" }, [createVNode(_component_q_btn, {
								flat: "",
								"no-caps": "",
								"text-color": "primary",
								label: "Отмена",
								onClick: ($event) => showNoteDialog.value = false
							}, null, 8, ["onClick"]), createVNode(_component_q_btn, {
								unelevated: "",
								"no-caps": "",
								color: "primary",
								label: "Сохранить",
								onClick: saveNote
							})])
						]),
						_: 1
					})];
				}),
				_: 1
			}, _parent));
			_push(ssrRenderComponent(_component_BottomNavigation, null, null, _parent));
			_push(`</div>`);
		};
	}
});
//#endregion
//#region app/pages/journal.vue
var _sfc_setup = journal_vue_vue_type_script_setup_true_lang_default.setup;
journal_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/journal.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var journal_default = /*#__PURE__*/ _plugin_vue_export_helper_default(journal_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-f14e01fe"]]);

export { journal_default as default };
//# sourceMappingURL=journal-vbio9Kql.mjs.map
