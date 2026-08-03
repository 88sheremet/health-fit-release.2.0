import { _ as _plugin_vue_export_helper_default } from '../virtual/entry.mjs';
import { a as moodEmojis } from './moods-EBspplfG.mjs';
import { u as useJournalStore } from './journal-DBmNbDmQ.mjs';
import { defineComponent, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs } from 'vue/server-renderer';
import { Line } from 'vue-chartjs';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } from 'chart.js';
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

//#region app/components/JournalChart.vue?vue&type=script&setup=true&lang.ts
var JournalChart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "JournalChart",
	__ssrInlineRender: true,
	setup(__props) {
		Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);
		const store = useJournalStore();
		const chartData = computed(() => ({
			labels: store.entries.map((entry) => new Date(entry.date).toLocaleDateString("ru-RU", {
				day: "2-digit",
				month: "2-digit"
			})),
			datasets: [{
				data: store.entries.map((entry) => entry.mood),
				borderColor: "#4caf50",
				backgroundColor: "#4caf50",
				tension: .4,
				pointRadius: 9,
				pointHoverRadius: 11
			}]
		}));
		const chartOptions = {
			responsive: true,
			plugins: { legend: { display: false } },
			scales: {
				x: { title: {
					display: true,
					text: "Дни"
				} },
				y: {
					min: 1,
					max: 5,
					ticks: {
						stepSize: 1,
						font: { size: 20 },
						callback(value) {
							return moodEmojis[value] || "";
						}
					}
				}
			}
		};
		return (_ctx, _push, _parent, _attrs) => {
			_push(`<div${ssrRenderAttrs(mergeProps({ class: "chart-page" }, _attrs))} data-v-fbb2631d><div class="chart-card" data-v-fbb2631d><div class="header" data-v-fbb2631d><button class="back-btn" data-v-fbb2631d><span class="material-icons" data-v-fbb2631d>arrow_back</span></button><div class="title" data-v-fbb2631d>График состояния</div></div>`);
			_push(ssrRenderComponent(unref(Line), {
				data: chartData.value,
				options: chartOptions
			}, null, _parent));
			_push(`</div></div>`);
		};
	}
});
//#endregion
//#region app/components/JournalChart.vue
var _sfc_setup$1 = JournalChart_vue_vue_type_script_setup_true_lang_default.setup;
JournalChart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/JournalChart.vue");
	return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var JournalChart_default = /*#__PURE__*/ Object.assign(_plugin_vue_export_helper_default(JournalChart_vue_vue_type_script_setup_true_lang_default, [["__scopeId", "data-v-fbb2631d"]]), { __name: "JournalChart" });
//#endregion
//#region app/pages/journal-chart.vue?vue&type=script&setup=true&lang.ts
var journal_chart_vue_vue_type_script_setup_true_lang_default = /*@__PURE__*/ defineComponent({
	__name: "journal-chart",
	__ssrInlineRender: true,
	setup(__props) {
		return (_ctx, _push, _parent, _attrs) => {
			_push(ssrRenderComponent(JournalChart_default, _attrs, null, _parent));
		};
	}
});
//#endregion
//#region app/pages/journal-chart.vue
var _sfc_setup = journal_chart_vue_vue_type_script_setup_true_lang_default.setup;
journal_chart_vue_vue_type_script_setup_true_lang_default.setup = (props, ctx) => {
	const ssrContext = useSSRContext();
	(ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/journal-chart.vue");
	return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var journal_chart_default = journal_chart_vue_vue_type_script_setup_true_lang_default;

export { journal_chart_default as default };
//# sourceMappingURL=journal-chart-Cbgr0JJv.mjs.map
