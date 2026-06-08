<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDateRange } from '@/composables/useDateRange'
import { getUserAttributions, fetchRecordNames } from '@/services/rewardService'
import type { UserAttribution, FusedReward } from '@/types/reward.types'

const { range } = useDateRange()

const attributions = ref<UserAttribution[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Expansion state
const expanded = ref<Set<string>>(new Set())
// Per-user reward page (userId → page number)
const rewardPages = ref<Record<string, number>>({})

const REWARD_PAGE_SIZE = 10
const USER_PAGE_SIZE = 10
const userPage = ref(1)

// Shared record name cache across all expanded users
const recordNames = ref<Record<string, string>>({})
const loadingNames = ref(false)

async function load() {
  loading.value = true
  error.value = null
  expanded.value = new Set()
  rewardPages.value = {}
  recordNames.value = {}
  userPage.value = 1
  try {
    attributions.value = await getUserAttributions(range.value)
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load data'
  } finally {
    loading.value = false
  }
}

watch(range, load, { immediate: true, deep: true })

const totalUserPages = computed(() => Math.max(1, Math.ceil(attributions.value.length / USER_PAGE_SIZE)))
const pagedUsers = computed(() =>
  attributions.value.slice((userPage.value - 1) * USER_PAGE_SIZE, userPage.value * USER_PAGE_SIZE)
)

function toggle(userId: string) {
  if (expanded.value.has(userId)) {
    expanded.value.delete(userId)
  } else {
    expanded.value.add(userId)
    if (!rewardPages.value[userId]) rewardPages.value[userId] = 1
    loadNamesForUser(userId)
  }
  expanded.value = new Set(expanded.value)
}

function rewardPage(userId: string) {
  return rewardPages.value[userId] ?? 1
}

function rewardTotalPages(attr: UserAttribution) {
  return Math.max(1, Math.ceil(attr.rewards.length / REWARD_PAGE_SIZE))
}

function pagedRewards(attr: UserAttribution): FusedReward[] {
  const p = rewardPage(attr.userId)
  return attr.rewards.slice((p - 1) * REWARD_PAGE_SIZE, p * REWARD_PAGE_SIZE)
}

function prevRewardPage(userId: string) {
  if ((rewardPages.value[userId] ?? 1) > 1) {
    rewardPages.value[userId] = (rewardPages.value[userId] ?? 1) - 1
    rewardPages.value = { ...rewardPages.value }
    loadNamesForUser(userId)
  }
}

function nextRewardPage(attr: UserAttribution) {
  const cur = rewardPages.value[attr.userId] ?? 1
  if (cur < rewardTotalPages(attr)) {
    rewardPages.value[attr.userId] = cur + 1
    rewardPages.value = { ...rewardPages.value }
    loadNamesForUser(attr.userId)
  }
}

async function loadNamesForUser(userId: string) {
  const attr = attributions.value.find(a => a.userId === userId)
  if (!attr) return
  const p = rewardPages.value[userId] ?? 1
  const slice = attr.rewards.slice((p - 1) * REWARD_PAGE_SIZE, p * REWARD_PAGE_SIZE)
  const missing = slice.filter(r => r.RecordId && !(r.RecordId in recordNames.value))
  if (!missing.length) return
  loadingNames.value = true
  try {
    const names = await fetchRecordNames(missing)
    recordNames.value = { ...recordNames.value, ...names }
  } finally {
    loadingNames.value = false
  }
}

function isTopPerformer(a: UserAttribution) {
  return attributions.value[0]?.userId === a.userId
}

function fmtCurrency(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function fmtDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusClass(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'ri-badge ri-badge--approved'
    case 'failed':   return 'ri-badge ri-badge--failed'
    default:         return 'ri-badge ri-badge--pending'
  }
}

function maxValue() {
  return attributions.value[0]?.totalValue ?? 1
}
</script>

<template>
  <AppLayout>
    <template #title>Who Earned What</template>

    <div v-if="loading" class="ri-loading">
      <span class="ri-spinner" />
      <span>Loading attributions…</span>
    </div>

    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-else-if="attributions.length === 0" class="ri-empty">
      No reward data found for this period.
    </div>

    <div v-else class="ri-attribution-list">
      <div
        v-for="(attr, idx) in pagedUsers"
        :key="attr.userId"
        class="ri-person-row"
        :class="{ 'ri-person-row--top': isTopPerformer(attr) }"
      >
        <!-- Person header -->
        <button class="ri-person-header" @click="toggle(attr.userId)">
          <div class="ri-person-header__left">
            <span class="ri-person-rank">{{ (userPage - 1) * USER_PAGE_SIZE + idx + 1 }}</span>
            <span class="ri-person-name">{{ attr.userName }}</span>
            <span v-if="isTopPerformer(attr)" class="ri-top-badge">★ Top Performer</span>
          </div>
          <div class="ri-person-header__right">
            <div class="ri-bar-wrap">
              <div
                class="ri-bar-fill"
                :style="{ width: ((attr.totalValue / maxValue()) * 100).toFixed(1) + '%' }"
              />
            </div>
            <span class="ri-person-value">{{ fmtCurrency(attr.totalValue) }}</span>
            <span class="ri-person-count">{{ attr.rewardCount }} reward{{ attr.rewardCount !== 1 ? 's' : '' }}</span>
            <span class="ri-chevron" :class="{ 'ri-chevron--open': expanded.has(attr.userId) }">▸</span>
          </div>
        </button>

        <!-- Expanded rewards -->
        <div v-if="expanded.has(attr.userId)" class="ri-person-rewards">
          <table class="ri-table ri-inner-table">
            <thead>
              <tr>
                <th>Record Type</th>
                <th>Record Name</th>
                <th>Program</th>
                <th>Value</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in pagedRewards(attr)" :key="r.Id">
                <td><span class="ri-entity-tag">{{ r.entityLabel }}</span></td>
                <td>
                  <span v-if="loadingNames && !recordNames[r.RecordId]" class="ri-name-loading">…</span>
                  <a
                    v-else
                    :href="`/${r.RecordId}`"
                    target="_blank"
                    rel="noopener"
                    class="ri-record-link"
                  >{{ recordNames[r.RecordId] ?? r.RecordId }}</a>
                </td>
                <td>{{ r.programName }}</td>
                <td class="ri-cell-num">{{ fmtCurrency(Number(r.Value)) }}</td>
                <td><span :class="statusClass(r.Status)">{{ r.Status }}</span></td>
                <td class="ri-cell-sm">{{ fmtDate(r.ApprovalOrRejectionDate) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Per-user reward pagination -->
          <div v-if="rewardTotalPages(attr) > 1" class="ri-reward-pagination">
            <button
              class="ri-page-btn"
              :disabled="rewardPage(attr.userId) <= 1"
              @click.stop="prevRewardPage(attr.userId)"
            >← Prev</button>
            <span class="ri-page-info">
              Page {{ rewardPage(attr.userId) }} of {{ rewardTotalPages(attr) }}
            </span>
            <button
              class="ri-page-btn"
              :disabled="rewardPage(attr.userId) >= rewardTotalPages(attr)"
              @click.stop="nextRewardPage(attr)"
            >Next →</button>
          </div>
        </div>
      </div>

      <!-- User list pagination -->
      <div v-if="totalUserPages > 1" class="ri-pagination">
        <button class="ri-page-btn" :disabled="userPage <= 1" @click="userPage--">← Prev</button>
        <span class="ri-page-info">Page {{ userPage }} of {{ totalUserPages }}</span>
        <button class="ri-page-btn" :disabled="userPage >= totalUserPages" @click="userPage++">Next →</button>
      </div>
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

.ri-attribution-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ri-person-row {
  border: 1px solid var(--mag-element-border-color);
  border-radius: 6px;
  overflow: hidden;
  background: var(--mag-page-bg-color);
}

.ri-person-row--top {
  border-color: var(--mag-primary-color);
  box-shadow: 0 0 0 2px rgba(56, 132, 199, 0.12);
}

.ri-person-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-family: var(--mag-primary-font);
}

.ri-person-header:hover {
  background: var(--mag-page-bg-300);
}

.ri-person-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ri-person-rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--mag-page-bg-300);
  color: var(--mag-base-300);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-family: var(--mag-primary-font);
}

.ri-person-row--top .ri-person-rank {
  background: var(--mag-primary-color);
  color: var(--mag-primary-text-color);
}

.ri-person-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--mag-page-text-color);
  font-family: var(--mag-heading-font);
}

.ri-top-badge {
  font-size: 11px;
  background: #fff8e1;
  color: #a17900;
  border: 1px solid #ffe082;
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 600;
}

.ri-person-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ri-bar-wrap {
  width: 120px;
  height: 6px;
  background: var(--mag-page-bg-300);
  border-radius: 3px;
  overflow: hidden;
}

.ri-bar-fill {
  height: 100%;
  background: var(--mag-primary-color);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.ri-person-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--mag-primary-color);
  font-family: var(--mag-heading-font);
  min-width: 90px;
  text-align: right;
}

.ri-person-count {
  font-size: 12px;
  color: var(--mag-base-400);
  min-width: 70px;
  text-align: right;
}

.ri-chevron {
  font-size: 14px;
  color: var(--mag-base-400);
  transition: transform 0.2s;
  display: inline-block;
}

.ri-chevron--open {
  transform: rotate(90deg);
}

.ri-person-rewards {
  border-top: 1px solid var(--mag-element-border-color);
  overflow-x: auto;
}

.ri-inner-table {
  background: var(--mag-page-bg-200);
}

/* Shared table/badge styles */
.ri-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  font-family: var(--mag-primary-font);
}

.ri-table th {
  padding: 9px 12px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--mag-base-300);
  border-bottom: 1px solid var(--mag-element-border-color);
  white-space: nowrap;
}

.ri-table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--mag-border-muted-color);
  color: var(--mag-page-text-color);
}

.ri-table tr:last-child td { border-bottom: none; }
.ri-table tr:hover td { background: var(--mag-page-bg-300); }

.ri-cell-mono { font-family: monospace; font-size: 12px; }
.ri-cell-sm   { font-size: 12px; white-space: nowrap; }
.ri-cell-num  { text-align: right; font-weight: 600; color: var(--mag-primary-color); }

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

.ri-record-link {
  color: var(--mag-primary-color);
  text-decoration: none;
  font-size: 13px;
}

.ri-record-link:hover { text-decoration: underline; }

.ri-name-loading {
  color: var(--mag-base-400);
  font-size: 13px;
}

.ri-reward-pagination {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--mag-element-border-color);
  background: var(--mag-page-bg-200);
}

.ri-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.ri-page-btn {
  padding: 5px 12px;
  font-size: 13px;
  font-family: var(--mag-primary-font);
  background: var(--mag-page-bg-200);
  border: 1px solid var(--mag-element-border-color);
  border-radius: 4px;
  cursor: pointer;
  color: var(--mag-page-text-color);
  transition: background 0.15s;
}

.ri-page-btn:hover:not(:disabled) { background: var(--mag-page-bg-300); }
.ri-page-btn:disabled { opacity: 0.4; cursor: default; }

.ri-page-info {
  font-size: 12px;
  color: var(--mag-base-400);
  font-family: var(--mag-primary-font);
  min-width: 90px;
  text-align: center;
}
</style>
