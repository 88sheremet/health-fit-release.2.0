<script setup lang="ts">
const supabase = useSupabase()

const rows = ref<any[]>([])
const loading = ref(true)
const error = ref("")

onMounted(async () => {
  const { data, error: err } = await supabase
    .from("test")
    .select("*")

  if (err) {
    error.value = err.message
  } else {
    rows.value = data ?? []
  }

  loading.value = false
})
</script>

<template>
  <div style="padding:40px">
    <h1>Supabase Test</h1>

    <p v-if="loading">Loading...</p>

    <p v-else-if="error">
      ❌ {{ error }}
    </p>

    <pre v-else>{{ rows }}</pre>
  </div>
</template>