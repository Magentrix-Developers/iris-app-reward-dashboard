<script setup lang="ts">
import { provideDateRange } from '@/composables/useDateRange'
provideDateRange()
</script>

<template>
  <router-view />
</template>
