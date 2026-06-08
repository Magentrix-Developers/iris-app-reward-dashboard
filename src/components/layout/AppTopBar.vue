<script setup lang="ts">
import { useDateRange } from '@/composables/useDateRange'

const { range, setRange } = useDateRange()

function onStartChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val && val <= range.value.end) {
    setRange({ ...range.value, start: val })
  }
}

function onEndChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (val && val >= range.value.start) {
    setRange({ ...range.value, end: val })
  }
}
</script>

<template>
  <header class="ri-topbar">
    <div class="ri-topbar__left">
      <slot name="title" />
    </div>
    <div class="ri-topbar__filter">
      <span class="ri-topbar__filter-label">Date Range</span>
      <input
        type="date"
        class="iris-textbox ri-topbar__date"
        :value="range.start"
        @change="onStartChange"
      />
      <span class="ri-topbar__sep">—</span>
      <input
        type="date"
        class="iris-textbox ri-topbar__date"
        :value="range.end"
        @change="onEndChange"
      />
    </div>
  </header>
</template>

<style scoped>
.ri-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  background: var(--mag-page-bg-color);
  border-bottom: 1px solid var(--mag-element-border-color);
  flex-shrink: 0;
}

.ri-topbar__left {
  font-family: var(--mag-heading-font);
  font-size: 17px;
  font-weight: 600;
  color: var(--mag-page-text-color);
}

.ri-topbar__filter {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ri-topbar__filter-label {
  font-size: 12px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  white-space: nowrap;
}

.ri-topbar__date {
  padding: 4px 8px;
  font-size: 13px;
  width: 140px;
}

.ri-topbar__sep {
  color: var(--mag-base-400);
  font-size: 13px;
}
</style>
