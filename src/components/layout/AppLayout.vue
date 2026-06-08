<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
</script>

<template>
  <div class="ri-layout">
    <AppSidebar />
    <div class="ri-layout__main">
      <AppTopBar>
        <template #title>
          <slot name="title" />
        </template>
      </AppTopBar>
      <div class="ri-layout__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ri-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--mag-page-bg-color);
  font-family: var(--mag-primary-font);
}

.ri-layout__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ri-layout__content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
</style>
