<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { name: 'home',               label: 'Reward Discovery',    icon: '⬡' },
  { name: 'combined-report',    label: 'Combined Report',     icon: '⊞' },
  { name: 'user-attribution',   label: 'Who Earned What',     icon: '◎' },
  { name: 'program-performance',label: 'Program Performance', icon: '▦' },
  { name: 'anomaly-report',     label: 'Anomaly Report',      icon: '⚑' },
  { name: 'trends',             label: 'Trends',              icon: '↗' },
]

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <nav class="ri-sidebar">
    <div class="ri-sidebar__brand">
      <span class="ri-sidebar__logo">RI</span>
      <span class="ri-sidebar__title">Reward Dashboard</span>
    </div>

    <ul class="ri-sidebar__nav">
      <li v-for="item in navItems" :key="item.name">
        <button
          class="ri-sidebar__item"
          :class="{ 'ri-sidebar__item--active': isActive(item.name) }"
          @click="router.push({ name: item.name })"
        >
          <span class="ri-sidebar__icon">{{ item.icon }}</span>
          <span class="ri-sidebar__label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.ri-sidebar {
  width: 220px;
  min-width: 220px;
  height: 100%;
  background: var(--mag-nav-bg-color);
  border-right: 1px solid var(--mag-element-border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.ri-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--mag-element-border-color);
}

.ri-sidebar__logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--mag-primary-color);
  color: var(--mag-primary-text-color);
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--mag-heading-font);
}

.ri-sidebar__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--mag-page-text-color);
  font-family: var(--mag-heading-font);
  line-height: 1.2;
}

.ri-sidebar__nav {
  list-style: none;
  padding: 8px 0;
  margin: 0;
  flex: 1;
}

.ri-sidebar__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--mag-nav-text-color);
  font-size: 13px;
  font-family: var(--mag-primary-font);
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
}

.ri-sidebar__item:hover {
  background: var(--mag-nav-hover-bg-color);
  color: var(--mag-page-text-color);
}

.ri-sidebar__item--active {
  background: var(--mag-nav-active-bg-color);
  color: var(--mag-primary-color);
  border-left-color: var(--mag-primary-color);
  font-weight: 600;
}

.ri-sidebar__icon {
  font-size: 15px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.ri-sidebar__label {
  flex: 1;
}
</style>
