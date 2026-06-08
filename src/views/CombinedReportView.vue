<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { getFusedRewards, fetchRecordNames } from '@/services/rewardService'
import type { FusedReward } from '@/types/reward.types'

const { range } = useDateRange()

const allRows = ref<FusedReward[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const statusFilter = ref<string>('All')
const searchText = ref<string>('')

const PAGE_SIZE = 10
const page = ref(1)

const recordNames = ref<Record<string, string>>({})
const loadingNames = ref(false)

const STATUS_OPTIONS = ['All', 'Approved', 'Pending', 'Failed']

async function load() {
  loading.value = true
  error.value = null
  try {
    allRows.value = await getFusedRewards(range.value)
    recordNames.value = {}
    page.value = 1
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data'
  } finally {
    loading.value = false
  }
}

watch(range, load, { immediate: true, deep: true })

// Reset to page 1 when filters change
watch([statusFilter, searchText], () => { page.value = 1 })

const filtered = computed(() => {
  let rows = allRows.value
  if (statusFilter.value !== 'All') {
    rows = rows.filter(r => r.Status?.toLowerCase() === statusFilter.value.toLowerCase())
  }
  const q = searchText.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter(r =>
      r.Name?.toString().includes(q) ||
      r.entityLabel?.toLowerCase().includes(q) ||
      r.userName?.toLowerCase().includes(q) ||
      r.programName?.toLowerCase().includes(q) ||
      r.RecordId?.toLowerCase().includes(q) ||
      (recordNames.value[r.RecordId] ?? '').toLowerCase().includes(q)
    )
  }
  return rows
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))

const pagedRows = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE)
)

async function loadPageNames() {
  const missing = pagedRows.value.filter(r => r.RecordId && !(r.RecordId in recordNames.value))
  if (!missing.length) return
  loadingNames.value = true
  try {
    const names = await fetchRecordNames(missing)
    recordNames.value = { ...recordNames.value, ...names }
  } finally {
    loadingNames.value = false
  }
}

watch(pagedRows, loadPageNames, { immediate: false })
watch(allRows, loadPageNames)

function recordName(r: FusedReward) {
  return recordNames.value[r.RecordId] ?? null
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'ri-badge ri-badge--approved'
    case 'failed':   return 'ri-badge ri-badge--failed'
    default:         return 'ri-badge ri-badge--pending'
  }
}

function exportCsv() {
  const headers = ['#', 'Record Type', 'Record Name', 'Record ID', 'User', 'Program', 'Value', 'Status', 'Date']
  const rows = filtered.value.map(r => [
    r.Name,
    r.entityLabel,
    recordNames.value[r.RecordId] ?? r.RecordId,
    r.RecordId,
    r.userName,
    r.programName,
    Number(r.Value).toFixed(2),
    r.Status,
    fmtDate(r.ApprovalOrRejectionDate),
  ])
  const csv = [headers, ...rows].map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `reward-dashboard-combined-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
</script>

<template>
  <AppLayout>
    <template #title>Combined Report</template>

    <div v-if="loading" class="ri-loading">
      <span class="ri-spinner" />
      <span>Loading rewards…</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <template v-else>
      <!-- Toolbar -->
      <div class="ri-toolbar">
        <div class="ri-toolbar__filters">
          <div class="ri-filter-group">
            <label class="iris-label">Status</label>
            <select v-model="statusFilter" class="iris-textbox ri-select">
              <option v-for="s in STATUS_OPTIONS" :key="s">{{ s }}</option>
            </select>
          </div>
          <div class="ri-filter-group">
            <label class="iris-label">Search</label>
            <input
              v-model="searchText"
              type="text"
              class="iris-textbox ri-search"
              placeholder="Name, user, program, record ID…"
            />
          </div>
        </div>
        <div class="ri-toolbar__actions">
          <span class="ri-count">{{ filtered.length.toLocaleString() }} records</span>
          <button class="btn-secondary" @click="exportCsv">Export CSV</button>
        </div>
      </div>

      <!-- Table -->
      <div class="ri-table-wrap">
        <table class="ri-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Record Type</th>
              <th>Record Name</th>
              <th>User</th>
              <th>Program</th>
              <th>Value</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.Id">
              <td class="ri-cell-mono">{{ row.Name }}</td>
              <td><span class="ri-entity-tag">{{ row.entityLabel }}</span></td>
              <td>
                <span v-if="loadingNames && !recordNames[row.RecordId]" class="ri-name-loading">…</span>
                <a
                  v-else
                  :href="`/${row.RecordId}`"
                  target="_blank"
                  rel="noopener"
                  class="ri-record-link"
                >{{ recordName(row) ?? row.RecordId }}</a>
              </td>
              <td>{{ row.userName }}</td>
              <td>{{ row.programName }}</td>
              <td class="ri-cell-num">{{ fmtCurrency(Number(row.Value)) }}</td>
              <td><span :class="statusClass(row.Status)">{{ row.Status }}</span></td>
              <td class="ri-cell-sm">{{ fmtDate(row.ApprovalOrRejectionDate) }}</td>
            </tr>
            <tr v-if="pagedRows.length === 0">
              <td colspan="8" class="ri-no-data">No records match your filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="ri-pagination">
        <button
          class="ri-page-btn"
          :disabled="page <= 1"
          @click="page--"
        >← Prev</button>
        <span class="ri-page-info">Page {{ page }} of {{ totalPages }}</span>
        <button
          class="ri-page-btn"
          :disabled="page >= totalPages"
          @click="page++"
        >Next →</button>
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

.ri-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.ri-toolbar__filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ri-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ri-select {
  min-width: 120px;
}

.ri-search {
  min-width: 240px;
}

.ri-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ri-count {
  font-size: 13px;
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
}

.ri-table td {
  padding: 9px 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
  color: var(--mag-page-text-color);
  vertical-align: middle;
}

.ri-table tr:last-child td {
  border-bottom: none;
}

.ri-table tr:hover td {
  background: var(--mag-page-bg-300);
}

.ri-cell-mono {
  font-family: monospace;
  font-size: 12px;
}

.ri-cell-sm {
  font-size: 12px;
  white-space: nowrap;
}

.ri-cell-num {
  text-align: right;
  font-weight: 600;
  color: var(--mag-primary-color);
}

.ri-entity-tag {
  background: var(--mag-page-bg-300);
  border: 1px solid var(--mag-border-muted-color);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-300);
  white-space: nowrap;
}

.ri-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.ri-badge--approved { background: #d4edda; color: #155724; }
.ri-badge--failed   { background: #f8d7da; color: #721c24; }
.ri-badge--pending  { background: #fff3cd; color: #856404; }

.ri-no-data {
  text-align: center;
  color: var(--mag-base-400);
  padding: 32px;
}

.ri-record-link {
  color: var(--mag-primary-color);
  text-decoration: none;
  font-size: 13px;
}

.ri-record-link:hover {
  text-decoration: underline;
}

.ri-name-loading {
  color: var(--mag-base-400);
  font-size: 13px;
}

.ri-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.ri-page-btn {
  padding: 6px 14px;
  font-size: 13px;
  font-family: var(--mag-primary-font);
  background: var(--mag-page-bg-200);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--mag-page-text-color);
  transition: background 0.15s;
}

.ri-page-btn:hover:not(:disabled) {
  background: var(--mag-page-bg-300);
}

.ri-page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.ri-page-info {
  font-size: 13px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  min-width: 100px;
  text-align: center;
}
</style>
