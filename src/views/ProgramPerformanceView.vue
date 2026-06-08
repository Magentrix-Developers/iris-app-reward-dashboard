<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { getProgramPerformance } from '@/services/rewardService'
import type { ProgramPerformance } from '@/types/reward.types'

const { range } = useDateRange()

const programs = ref<ProgramPerformance[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const expanded = ref<Set<string>>(new Set())
const sortKey = ref<keyof ProgramPerformance>('totalValue')
const sortDir = ref<1 | -1>(-1)

async function load() {
  loading.value = true
  error.value = null
  expanded.value = new Set()
  try {
    programs.value = await getProgramPerformance(range.value)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data'
  } finally {
    loading.value = false
  }
}

watch(range, load, { immediate: true, deep: true })

const sorted = computed(() => {
  return [...programs.value].sort((a, b) => {
    const av = a[sortKey.value] as number
    const bv = b[sortKey.value] as number
    return sortDir.value * (av > bv ? 1 : av < bv ? -1 : 0)
  })
})

function sortBy(key: keyof ProgramPerformance) {
  if (sortKey.value === key) sortDir.value = (sortDir.value * -1) as 1 | -1
  else { sortKey.value = key; sortDir.value = -1 }
}

function sortIcon(key: keyof ProgramPerformance) {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === -1 ? '↓' : '↑'
}

function toggle(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function approvalPct(p: ProgramPerformance) {
  if (!p.totalRewards) return 0
  return Math.round((p.approved / p.totalRewards) * 100)
}
</script>

<template>
  <AppLayout>
    <template #title>Program Performance</template>

    <div v-if="loading" class="ri-loading">
      <span class="ri-spinner" />
      <span>Loading programs…</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="programs.length === 0" class="ri-empty">
      No program data found for this period.
    </div>

    <div v-else class="ri-table-wrap">
      <table class="ri-table">
        <thead>
          <tr>
            <th class="ri-th-expand"></th>
            <th>Program</th>
            <th class="ri-th-sort" @click="sortBy('totalRewards')">
              Rewards {{ sortIcon('totalRewards') }}
            </th>
            <th class="ri-th-sort" @click="sortBy('totalValue')">
              Total Value {{ sortIcon('totalValue') }}
            </th>
            <th class="ri-th-sort" @click="sortBy('approved')">
              Approved {{ sortIcon('approved') }}
            </th>
            <th class="ri-th-sort" @click="sortBy('pending')">
              Pending {{ sortIcon('pending') }}
            </th>
            <th class="ri-th-sort" @click="sortBy('failed')">
              Failed {{ sortIcon('failed') }}
            </th>
            <th>Approval Rate</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="prog in sorted" :key="prog.programId">
            <tr class="ri-prog-row" @click="toggle(prog.programId)">
              <td class="ri-td-expand">
                <span class="ri-chevron" :class="{ 'ri-chevron--open': expanded.has(prog.programId) }">▸</span>
              </td>
              <td class="ri-prog-name">{{ prog.programName }}</td>
              <td class="ri-cell-num">{{ prog.totalRewards.toLocaleString() }}</td>
              <td class="ri-cell-num-primary">{{ fmtCurrency(prog.totalValue) }}</td>
              <td class="ri-cell-approved">{{ prog.approved }}</td>
              <td class="ri-cell-pending">{{ prog.pending }}</td>
              <td class="ri-cell-failed">{{ prog.failed }}</td>
              <td>
                <div class="ri-rate-bar">
                  <div class="ri-rate-track">
                    <div class="ri-rate-fill" :style="{ width: approvalPct(prog) + '%' }" />
                  </div>
                  <span class="ri-rate-pct">{{ approvalPct(prog) }}%</span>
                </div>
              </td>
            </tr>

            <!-- Expanded breakdown -->
            <tr v-if="expanded.has(prog.programId)" class="ri-breakdown-row">
              <td colspan="8" class="ri-breakdown-cell">
                <div class="ri-breakdown">
                  <div class="ri-breakdown__title">Record Type Breakdown</div>
                  <div class="ri-breakdown__chips">
                    <div
                      v-for="eb in prog.entityBreakdown"
                      :key="eb.label"
                      class="ri-breakdown__chip"
                    >
                      <span class="ri-breakdown__chip-label">{{ eb.label }}</span>
                      <span class="ri-breakdown__chip-count">{{ eb.count }}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="sorted.length === 0">
            <td colspan="8" class="ri-no-data">No programs found.</td>
          </tr>
        </tbody>
      </table>
    </div>
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
  user-select: none;
}

.ri-th-sort {
  cursor: pointer;
}

.ri-th-sort:hover { color: var(--mag-primary-color); }
.ri-th-expand { width: 30px; }

.ri-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
  color: var(--mag-page-text-color);
  vertical-align: middle;
}

.ri-prog-row { cursor: pointer; }
.ri-prog-row:hover td { background: var(--mag-page-bg-300); }

.ri-td-expand { text-align: center; }

.ri-prog-name {
  font-weight: 600;
  color: var(--mag-page-text-color);
}

.ri-cell-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ri-cell-num-primary {
  text-align: right;
  font-weight: 700;
  color: var(--mag-primary-color);
  font-variant-numeric: tabular-nums;
}

.ri-cell-approved { color: #155724; font-weight: 600; text-align: right; }
.ri-cell-pending  { color: #856404; font-weight: 600; text-align: right; }
.ri-cell-failed   { color: #721c24; font-weight: 600; text-align: right; }

.ri-chevron {
  font-size: 13px;
  color: var(--mag-base-400);
  transition: transform 0.2s;
  display: inline-block;
}

.ri-chevron--open { transform: rotate(90deg); }

.ri-rate-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ri-rate-track {
  flex: 1;
  height: 6px;
  background: var(--mag-page-bg-300);
  border-radius: 3px;
  min-width: 80px;
  overflow: hidden;
}

.ri-rate-fill {
  height: 100%;
  background: #28a745;
  border-radius: 3px;
  transition: width 0.3s;
}

.ri-rate-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-300);
  min-width: 36px;
  text-align: right;
}

.ri-breakdown-row td {
  background: var(--mag-page-bg-200);
  border-bottom: 1px solid var(--mag-element-border-color);
}

.ri-breakdown-cell { padding: 12px 16px 12px 36px; }

.ri-breakdown__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-400);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ri-breakdown__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ri-breakdown__chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--mag-page-bg-color);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 4px;
  padding: 4px 10px;
}

.ri-breakdown__chip-label {
  font-size: 12px;
  color: var(--mag-base-300);
}

.ri-breakdown__chip-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--mag-primary-color);
  background: var(--mag-page-bg-300);
  border-radius: 10px;
  padding: 1px 7px;
}

.ri-no-data {
  text-align: center;
  color: var(--mag-base-400);
  padding: 32px;
}
</style>
