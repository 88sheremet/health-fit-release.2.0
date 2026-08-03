<script setup lang="ts">
const { $supabase } = useNuxtApp()

const check = async () => {
  console.log($supabase)
}

onMounted(check)
</script>

<template>
  <div>Supabase Test</div>
</template>