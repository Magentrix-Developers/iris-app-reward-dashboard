<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { scanAnomalies } from '@/services/rewardService'
import type { AnomalyRecord } from '@/types/reward.types'

const { range } = useDateRange()

const anomalies = ref<AnomalyRecord[]>([])
const loading = ref(false)
const scanDone = ref(0)
const scanTotal = ref(0)
const error = ref<string | null>(null)
const hasScanned = ref(false)
const highValueThreshold = ref<number>(100)

async function runScan() {
  loading.value = true
  hasScanned.value = false
  error.value = null
  anomalies.value = []
  scanDone.value = 0
  scanTotal.value = 0
  try {
    const results = await scanAnomalies(range.value, (done, total) => {
      scanDone.value = done
      scanTotal.value = total
    })
    anomalies.value = results.map(a => ({
      ...a,
      isHighValue: Number(a.reward.Value) >= highValueThreshold.value,
    }))
    hasScanned.value = true
  } catch (e: any) {
    error.value = e?.message ?? 'Scan failed'
  } finally {
    loading.value = false
  }
}

watch(range, () => { hasScanned.value = false }, { deep: true })

const progressPct = computed(() => {
  if (!scanTotal.value) return 0
  return Math.round((scanDone.value / scanTotal.value) * 100)
})

function fmtCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function exportCsv() {
  const headers = ['Record ID', 'Entity Type', 'Value', 'High Value', 'Status', 'Date']
  const rows = anomalies.value.map(a => [
    a.reward.RecordId,
    a.entityLabel,
    Number(a.reward.Value).toFixed(2),
    a.isHighValue ? 'Yes' : 'No',
    a.reward.Status,
    fmtDate(a.reward.ApprovalOrRejectionDate),
  ])
  const csv = [headers, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `reward-dashboard-anomalies-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
</script>

<template>
  <AppLayout>
    <template #title>Anomaly Report</template>

    <!-- Controls -->
    <div class="ri-anomaly-controls">
      <div class="ri-filter-group">
        <label class="iris-label">High-Value Threshold ($)</label>
        <input
          v-model.number="highValueThreshold"
          type="number"
          min="0"
          class="iris-textbox ri-threshold-input"
          :disabled="loading"
        />
      </div>
      <button class="btn-primary" :disabled="loading" @click="runScan">
        {{ loading ? 'Scanning…' : hasScanned ? 'Re-Scan' : 'Start Scan' }}
      </button>
    </div>

    <!-- Progress bar -->
    <div v-if="loading" class="ri-progress-wrap">
      <div class="ri-progress-info">
        <span>Checking {{ scanDone }} / {{ scanTotal }} records…</span>
        <span>{{ progressPct }}%</span>
      </div>
      <div class="ri-progress-track">
        <div class="ri-progress-fill" :style="{ width: progressPct + '%' }" />
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- Results -->
    <template v-if="hasScanned && !loading">
      <div v-if="anomalies.length === 0" class="alert alert-success">
        ✓ No anomalies found. All reward records link to existing records.
      </div>

      <template v-else>
        <div class="ri-anomaly-summary">
          <div class="ri-anomaly-summary__item ri-anomaly-summary__item--orphan">
            <span class="ri-anomaly-summary__num">{{ anomalies.length }}</span>
            <span class="ri-anomaly-summary__lbl">Orphaned Rewards</span>
          </div>
          <div class="ri-anomaly-summary__item ri-anomaly-summary__item--high">
            <span class="ri-anomaly-summary__num">{{ anomalies.filter(a => a.isHighValue).length }}</span>
            <span class="ri-anomaly-summary__lbl">High-Value Orphans (&ge;${{ highValueThreshold }})</span>
          </div>
          <div class="ri-anomaly-summary__actions">
            <button class="btn-secondary" @click="exportCsv">Export CSV</button>
          </div>
        </div>

        <div class="ri-table-wrap">
          <table class="ri-table">
            <thead>
              <tr>
                <th>Flag</th>
                <th>Record ID</th>
                <th>Entity Type</th>
                <th>Value</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="a in anomalies"
                :key="a.reward.Id"
                :class="a.isHighValue ? 'ri-row--high' : 'ri-row--orphan'"
              >
                <td>
                  <span v-if="a.isHighValue" class="ri-flag ri-flag--high">⚠ High Value</span>
                  <span v-else class="ri-flag ri-flag--orphan">⊘ Orphan</span>
                </td>
                <td class="ri-cell-mono">{{ a.reward.RecordId }}</td>
                <td><span class="ri-entity-tag">{{ a.entityLabel }}</span></td>
                <td class="ri-cell-num" :class="{ 'ri-cell-high': a.isHighValue }">
                  {{ fmtCurrency(Number(a.reward.Value)) }}
                </td>
                <td>{{ a.reward.Status }}</td>
                <td class="ri-cell-sm">{{ fmtDate(a.reward.ApprovalOrRejectionDate) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <div v-if="!hasScanned && !loading" class="ri-scan-prompt">
      Set your threshold and click <strong>Start Scan</strong> to check all reward records for orphaned linked records.
    </div>
  </AppLayout>
</template>

<style scoped>
.ri-anomaly-controls {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.ri-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ri-threshold-input {
  width: 120px;
}

.ri-progress-wrap {
  margin-bottom: 20px;
}

.ri-progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  margin-bottom: 6px;
}

.ri-progress-track {
  height: 8px;
  background: var(--mag-page-bg-300);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--mag-element-border-color);
}

.ri-progress-fill {
  height: 100%;
  background: var(--mag-primary-color);
  border-radius: 4px;
  transition: width 0.2s ease;
}

.ri-anomaly-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.ri-anomaly-summary__item {
  flex: 1;
  min-width: 160px;
  padding: 14px 20px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ri-anomaly-summary__item--orphan {
  background: #fff3cd;
  border: 1px solid #ffe082;
}

.ri-anomaly-summary__item--high {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.ri-anomaly-summary__num {
  font-size: 28px;
  font-weight: 700;
  font-family: var(--mag-heading-font);
}

.ri-anomaly-summary__item--orphan .ri-anomaly-summary__num { color: #856404; }
.ri-anomaly-summary__item--high .ri-anomaly-summary__num   { color: #721c24; }

.ri-anomaly-summary__lbl {
  font-size: 12px;
  font-family: var(--mag-primary-font);
  color: var(--mag-base-300);
}

.ri-anomaly-summary__actions {
  margin-left: auto;
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
}

.ri-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
  color: var(--mag-page-text-color);
  vertical-align: middle;
}

.ri-table tr:last-child td { border-bottom: none; }

.ri-row--high td { background: rgba(248, 215, 218, 0.25); }
.ri-row--orphan td { background: rgba(255, 243, 205, 0.25); }

.ri-flag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.ri-flag--orphan { background: #fff3cd; color: #856404; border: 1px solid #ffe082; }
.ri-flag--high   { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.ri-cell-mono  { font-family: monospace; font-size: 12px; }
.ri-cell-sm    { font-size: 12px; white-space: nowrap; }
.ri-cell-num   { text-align: right; font-weight: 600; }
.ri-cell-high  { color: #721c24; }

.ri-entity-tag {
  background: var(--mag-page-bg-300);
  border: 1px solid var(--mag-border-muted-color);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-300);
}

.ri-scan-prompt {
  text-align: center;
  padding: 48px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  font-size: 14px;
}
</style>
