<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { getEntityGroups } from '@/services/rewardService'
import type { EntityGroup } from '@/types/reward.types'

const router = useRouter()
const { range } = useDateRange()

const groups = ref<EntityGroup[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    groups.value = await getEntityGroups(range.value)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data'
  } finally {
    loading.value = false
  }
}

watch(range, load, { immediate: true, deep: true })

function totalRewards() {
  return groups.value.reduce((s, g) => s + g.rewardCount, 0)
}

function totalValue() {
  return groups.value.reduce((s, g) => s + g.totalValue, 0)
}

function fmtCurrency(val: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(val)
}

function goToReport(group: EntityGroup) {
  router.push({ name: 'combined-report', query: { prefix: group.keyPrefix } })
}
</script>

<template>
  <AppLayout>
    <template #title>Reward Discovery</template>

    <div v-if="loading" class="ri-loading">
      <span class="ri-spinner" />
      <span>Scanning reward records…</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else>
      <!-- Summary strip -->
      <div class="ri-summary-strip">
        <div class="ri-summary-strip__item">
          <span class="ri-summary-strip__num">{{ totalRewards().toLocaleString() }}</span>
          <span class="ri-summary-strip__lbl">Total Rewards</span>
        </div>
        <div class="ri-summary-strip__item">
          <span class="ri-summary-strip__num">{{ fmtCurrency(totalValue()) }}</span>
          <span class="ri-summary-strip__lbl">Total Value</span>
        </div>
        <div class="ri-summary-strip__item">
          <span class="ri-summary-strip__num">{{ groups.length }}</span>
          <span class="ri-summary-strip__lbl">Record Types</span>
        </div>
      </div>

      <!-- Entity cards -->
      <div v-if="groups.length === 0" class="ri-empty">
        No reward records found for this date range.
      </div>

      <div class="ri-entity-grid">
        <button
          v-for="group in groups"
          :key="group.keyPrefix"
          class="ri-entity-card"
          @click="goToReport(group)"
        >
          <div class="ri-entity-card__header">
            <span class="ri-entity-card__prefix">{{ group.keyPrefix }}</span>
            <span class="ri-entity-card__badge">{{ group.rewardCount }}</span>
          </div>
          <div class="ri-entity-card__name">{{ group.label }}</div>
          <div class="ri-entity-card__value">{{ fmtCurrency(group.totalValue, group.currency) }}</div>
          <div class="ri-entity-card__footer">View Report →</div>
        </button>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.ri-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--mag-base-400);
  padding: 48px 0;
  font-family: var(--mag-primary-font);
  justify-content: center;
}

.ri-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--mag-element-border-color);
  border-top-color: var(--mag-primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

.ri-summary-strip {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.ri-summary-strip__item {
  flex: 1;
  background: var(--mag-page-bg-200);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 6px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ri-summary-strip__num {
  font-size: 24px;
  font-weight: 700;
  color: var(--mag-page-text-color);
  font-family: var(--mag-heading-font);
}

.ri-summary-strip__lbl {
  font-size: 12px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
}

.ri-empty {
  text-align: center;
  padding: 48px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
}

.ri-entity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.ri-entity-card {
  background: var(--mag-page-bg-color);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--mag-primary-font);
}

.ri-entity-card:hover {
  border-color: var(--mag-primary-color);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.ri-entity-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.ri-entity-card__prefix {
  font-size: 11px;
  font-weight: 600;
  color: var(--mag-base-400);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: monospace;
}

.ri-entity-card__badge {
  background: var(--mag-primary-color);
  color: var(--mag-primary-text-color);
  font-size: 12px;
  font-weight: 700;
  border-radius: 12px;
  padding: 2px 10px;
}

.ri-entity-card__name {
  font-size: 16px;
  font-weight: 600;
  color: var(--mag-page-text-color);
  font-family: var(--mag-heading-font);
}

.ri-entity-card__value {
  font-size: 20px;
  font-weight: 700;
  color: var(--mag-primary-color);
  font-family: var(--mag-heading-font);
}

.ri-entity-card__footer {
  font-size: 12px;
  color: var(--mag-base-400);
  margin-top: 8px;
}

.ri-entity-card:hover .ri-entity-card__footer {
  color: var(--mag-primary-color);
}
</style>
