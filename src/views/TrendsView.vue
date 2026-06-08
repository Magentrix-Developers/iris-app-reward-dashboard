<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { getTrends } from '@/services/rewardService'
import type { TrendMonth } from '@/types/reward.types'

const { range } = useDateRange()

const months = ref<TrendMonth[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const mode = ref<'count' | 'value'>('count')

async function load() {
  loading.value = true
  error.value = null
  try {
    months.value = await getTrends(range.value)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load trends'
  } finally {
    loading.value = false
  }
}

watch(range, load, { immediate: true, deep: true })

// All unique entity labels across months
const allLabels = computed(() => {
  const s = new Set<string>()
  for (const m of months.value)
    for (const k of Object.keys(m.byEntity))
      s.add(k)
  return [...s]
})

const COLORS = [
  'var(--mag-primary-color)',
  '#28a745',
  '#fd7e14',
  '#6f42c1',
  '#17a2b8',
  '#e83e8c',
  '#20c997',
  '#ffc107',
]

function colorFor(label: string) {
  const idx = allLabels.value.indexOf(label)
  return COLORS[idx % COLORS.length]
}

const maxVal = computed(() => {
  if (!months.value.length) return 1
  return Math.max(...months.value.map(m => mode.value === 'count' ? m.total : m.value), 1)
})

function barHeight(m: TrendMonth, label: string) {
  const seg = m.byEntity[label]
  if (!seg) return 0
  const val = mode.value === 'count' ? seg.count : seg.value
  return (val / maxVal.value) * 100
}

function totalForMonth(m: TrendMonth) {
  return mode.value === 'count' ? m.total : m.value
}

function fmtVal(v: number) {
  if (mode.value === 'value') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v)
  }
  return v.toLocaleString()
}

function fmtFull(v: number) {
  if (mode.value === 'value') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)
  }
  return v.toLocaleString()
}
</script>

<template>
  <AppLayout>
    <template #title>Trends</template>

    <div v-if="loading" class="ri-loading">
      <span class="ri-spinner" />
      <span>Loading trends…</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else-if="months.length">
      <!-- Toggle -->
      <div class="ri-trends-toolbar">
        <div class="ri-toggle-group">
          <button
            class="ri-toggle-btn"
            :class="{ 'ri-toggle-btn--active': mode === 'count' }"
            @click="mode = 'count'"
          >Reward Count</button>
          <button
            class="ri-toggle-btn"
            :class="{ 'ri-toggle-btn--active': mode === 'value' }"
            @click="mode = 'value'"
          >Total Value</button>
        </div>

        <!-- Legend -->
        <div class="ri-legend">
          <div v-for="label in allLabels" :key="label" class="ri-legend__item">
            <span class="ri-legend__dot" :style="{ background: colorFor(label) }" />
            <span class="ri-legend__label">{{ label }}</span>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="ri-chart-wrap">
        <div class="ri-chart">
          <div v-for="m in months" :key="m.month" class="ri-chart__col">
            <div class="ri-chart__bar-wrap">
              <!-- Stacked segments -->
              <div
                v-for="label in allLabels"
                :key="label"
                class="ri-chart__segment"
                :style="{
                  height: barHeight(m, label) + '%',
                  background: colorFor(label),
                }"
                :title="`${label}: ${fmtFull(mode === 'count' ? (m.byEntity[label]?.count ?? 0) : (m.byEntity[label]?.value ?? 0))}`"
              />
            </div>
            <div class="ri-chart__val">{{ fmtVal(totalForMonth(m)) }}</div>
            <div class="ri-chart__lbl">{{ m.label }}</div>
          </div>
        </div>
      </div>

      <!-- Data table -->
      <div class="ri-table-wrap">
        <table class="ri-table">
          <thead>
            <tr>
              <th>Month</th>
              <th v-for="label in allLabels" :key="label" class="ri-cell-num">{{ label }}</th>
              <th class="ri-cell-num">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in months" :key="m.month">
              <td>{{ m.label }}</td>
              <td v-for="label in allLabels" :key="label" class="ri-cell-num">
                {{ fmtFull(mode === 'count' ? (m.byEntity[label]?.count ?? 0) : (m.byEntity[label]?.value ?? 0)) }}
              </td>
              <td class="ri-cell-num ri-cell-total">{{ fmtFull(totalForMonth(m)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-else class="ri-empty">No trend data found for this period.</div>
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
}

@keyframes spin { to { transform: rotate(360deg); } }

.ri-empty {
  text-align: center;
  padding: 48px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
}

.ri-trends-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.ri-toggle-group {
  display: flex;
  border: 1px solid var(--mag-element-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.ri-toggle-btn {
  padding: 7px 16px;
  font-size: 13px;
  font-family: var(--mag-primary-font);
  background: var(--mag-page-bg-color);
  border: none;
  cursor: pointer;
  color: var(--mag-base-300);
  transition: background 0.15s, color 0.15s;
}

.ri-toggle-btn + .ri-toggle-btn {
  border-left: 1px solid var(--mag-element-border-color);
}

.ri-toggle-btn--active {
  background: var(--mag-primary-color);
  color: var(--mag-primary-text-color);
  font-weight: 600;
}

.ri-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ri-legend__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ri-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.ri-legend__label {
  font-size: 12px;
  color: var(--mag-base-300);
  font-family: var(--mag-primary-font);
}

/* Chart */
.ri-chart-wrap {
  background: var(--mag-page-bg-color);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 6px;
  padding: 20px 20px 12px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.ri-chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  min-width: max-content;
  padding-bottom: 4px;
}

.ri-chart__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  width: 60px;
}

.ri-chart__bar-wrap {
  width: 40px;
  height: 160px;
  display: flex;
  flex-direction: column-reverse;
  align-items: stretch;
  border-radius: 3px 3px 0 0;
  overflow: hidden;
  background: var(--mag-page-bg-300);
}

.ri-chart__segment {
  flex-shrink: 0;
  transition: height 0.3s ease;
}

.ri-chart__val {
  font-size: 10px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  text-align: center;
  white-space: nowrap;
}

.ri-chart__lbl {
  font-size: 11px;
  color: var(--mag-base-300);
  font-family: var(--mag-primary-font);
  text-align: center;
  transform: rotate(-30deg);
  transform-origin: top center;
  white-space: nowrap;
  margin-top: 4px;
}

/* Table */
.ri-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--mag-element-border-color);
  border-radius: 6px;
}

.ri-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: var(--mag-primary-font);
}

.ri-table th {
  background: var(--mag-page-bg-200);
  padding: 10px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-300);
  border-bottom: 1px solid var(--mag-element-border-color);
  white-space: nowrap;
}

.ri-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
  color: var(--mag-page-text-color);
}

.ri-table tr:last-child td { border-bottom: none; }
.ri-table tr:hover td { background: var(--mag-page-bg-300); }

.ri-cell-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ri-cell-total {
  font-weight: 700;
  color: var(--mag-primary-color);
}
</style>
