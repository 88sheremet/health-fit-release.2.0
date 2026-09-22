<template>
  <JournalChart />
</template>

<script setup lang="ts">
import JournalChart from "~/components/JournalChart.vue";
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});
</script>
