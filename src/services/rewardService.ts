import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'
import { MagentrixError } from '@magentrix-corp/magentrix-sdk'
import { magentrixConfig } from '@/env-helper'
import type {
  Reward, EntityInfo, EntityGroup, FusedReward,
  UserAttribution, ProgramPerformance, AnomalyRecord,
  TrendMonth, DateRange,
} from '@/types/reward.types'
import { ENTITY_PREFIX_MAP } from '@/types/reward.types'

const dataService = useMagentrixSdk().getInstance(magentrixConfig)

// Build a complete prefix→entity map by querying the Entity registry,
// then merging with known static entries.
let _entityMapCache: Record<string, EntityInfo> | null = null

export async function getEntityMap(): Promise<Record<string, EntityInfo>> {
  if (_entityMapCache) return _entityMapCache

  const map: Record<string, EntityInfo> = { ...ENTITY_PREFIX_MAP }

  try {
    const result = await dataService.query(
      'SELECT Name, Label, KeyPrefix FROM Entity WHERE IsHidden = false ORDER BY Name'
    )
    for (const e of (result.data as any[])) {
      if (e.KeyPrefix) {
        map[e.KeyPrefix] = {
          keyPrefix: e.KeyPrefix,
          entityName: e.Name,
          label: e.Label || e.Name,
        }
      }
    }
  } catch {
    // Fallback to static map — entity registry may not be accessible
  }

  _entityMapCache = map
  return map
}

export function resolveEntity(prefix: string, map: Record<string, EntityInfo>): EntityInfo {
  return map[prefix] ?? { keyPrefix: prefix, entityName: prefix, label: prefix }
}

// Fetch all rewards within date range (paginated, up to 10k)
export async function fetchRewards(range: DateRange): Promise<Reward[]> {
  const all: Reward[] = []
  const pageSize = 500
  let offset = 0

  while (true) {
    const result = await dataService.query(
      `SELECT Id, Name, RecordId, UserId, ProgramId, RewardActivityId, RewardType,
              Status, Value, IsoCurrencyCode, AssignmentMethod, PaymentType,
              ApprovalOrRejectionDate, CreatedOn, OwnerId
       FROM Reward
       WHERE CreatedOn >= "${range.start}" AND CreatedOn <= "${range.end}"
       ORDER BY CreatedOn DESC
       LIMIT ${pageSize}, ${offset}`
    )
    const page: Reward[] = result.data as Reward[]
    all.push(...page)
    if (page.length < pageSize) break
    offset += pageSize
  }

  return all
}

// HOME — group rewards by entity prefix
export async function getEntityGroups(range: DateRange): Promise<EntityGroup[]> {
  const [rewards, entityMap] = await Promise.all([
    fetchRewards(range),
    getEntityMap(),
  ])

  const groups: Record<string, EntityGroup> = {}

  for (const r of rewards) {
    const prefix = r.RecordId?.slice(0, 3) ?? 'UNK'
    const info = resolveEntity(prefix, entityMap)

    if (!groups[prefix]) {
      groups[prefix] = {
        keyPrefix: prefix,
        entityName: info.entityName,
        label: info.label,
        rewardCount: 0,
        totalValue: 0,
        currency: r.IsoCurrencyCode || 'USD',
      }
    }
    groups[prefix].rewardCount++
    groups[prefix].totalValue += Number(r.Value) || 0
  }

  return Object.values(groups).sort((a, b) => b.rewardCount - a.rewardCount)
}

// COMBINED REPORT — rewards with resolved names
export async function getFusedRewards(range: DateRange): Promise<FusedReward[]> {
  const [rewards, entityMap] = await Promise.all([
    fetchRewards(range),
    getEntityMap(),
  ])

  // Collect unique user IDs and program IDs for batch name resolution
  const userIds = [...new Set(rewards.map(r => r.UserId).filter(Boolean))]
  const programIds = [...new Set(rewards.map(r => r.ProgramId).filter(Boolean))]

  const userNames: Record<string, string> = {}
  const programNames: Record<string, string> = {}

  await Promise.all([
    resolveNames(userIds, 'User', userNames),
    resolveNames(programIds, 'RewardProgram', programNames),
  ])

  return rewards.map(r => {
    const prefix = r.RecordId?.slice(0, 3) ?? 'UNK'
    const info = resolveEntity(prefix, entityMap)
    return {
      ...r,
      entityLabel: info.label,
      entityName: info.entityName,
      userName: userNames[r.UserId] ?? r.UserId,
      programName: programNames[r.ProgramId] ?? r.ProgramId,
    }
  })
}

// Fetch Name for a batch of FusedReward records (grouped by entityName)
export async function fetchRecordNames(records: FusedReward[]): Promise<Record<string, string>> {
  const byEntity: Record<string, string[]> = {}
  for (const r of records) {
    if (!r.RecordId || !r.entityName) continue
    if (!byEntity[r.entityName]) byEntity[r.entityName] = []
    byEntity[r.entityName].push(r.RecordId)
  }

  const names: Record<string, string> = {}
  await Promise.all(
    Object.entries(byEntity).map(async ([entityName, ids]) => {
      await resolveNames(ids, entityName, names)
    })
  )
  return names
}

async function resolveNames(
  ids: string[],
  entityName: string,
  out: Record<string, string>
): Promise<void> {
  if (!ids.length) return
  // Query in chunks of 50 (MEQL OR limit)
  const chunks = chunkArray(ids, 50)
  await Promise.all(
    chunks.map(async chunk => {
      try {
        const conditions = chunk.map(id => `Id = "${id}"`).join(' OR ')
        const result = await dataService.query(
          `SELECT Id, Name FROM ${entityName} WHERE ${conditions}`
        )
        for (const rec of (result.data as any[])) {
          out[rec.Id] = rec.Name
        }
      } catch {
        // ignore individual failures
      }
    })
  )
}

// WHO EARNED WHAT — group fused rewards by user
export async function getUserAttributions(range: DateRange): Promise<UserAttribution[]> {
  const fused = await getFusedRewards(range)

  const byUser: Record<string, UserAttribution> = {}

  for (const r of fused) {
    if (!byUser[r.UserId]) {
      byUser[r.UserId] = {
        userId: r.UserId,
        userName: r.userName ?? r.UserId,
        rewardCount: 0,
        totalValue: 0,
        rewards: [],
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    byUser[r.UserId]!.rewardCount++
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    byUser[r.UserId]!.totalValue += Number(r.Value) || 0
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    byUser[r.UserId]!.rewards.push(r)
  }

  return Object.values(byUser).sort((a, b) => b.totalValue - a.totalValue)
}

// PROGRAM PERFORMANCE
export async function getProgramPerformance(range: DateRange): Promise<ProgramPerformance[]> {
  const [fused, entityMap] = await Promise.all([
    getFusedRewards(range),
    getEntityMap(),
  ])

  const byProgram: Record<string, ProgramPerformance> = {}

  for (const r of fused) {
    if (!byProgram[r.ProgramId]) {
      byProgram[r.ProgramId] = {
        programId: r.ProgramId,
        programName: r.programName ?? r.ProgramId,
        totalRewards: 0,
        totalValue: 0,
        approved: 0,
        pending: 0,
        failed: 0,
        entityBreakdown: [],
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const prog = byProgram[r.ProgramId]!
    prog.totalRewards++
    prog.totalValue += Number(r.Value) || 0

    const s = r.Status?.toLowerCase()
    if (s === 'approved') prog.approved++
    else if (s === 'failed') prog.failed++
    else prog.pending++

    const existing = prog.entityBreakdown.find(e => e.label === r.entityLabel)
    if (existing) existing.count++
    else prog.entityBreakdown.push({ label: r.entityLabel, count: 1 })
  }

  return Object.values(byProgram).sort((a, b) => b.totalValue - a.totalValue)
}

// ANOMALY REPORT — check each unique RecordId for existence
export async function scanAnomalies(
  range: DateRange,
  onProgress: (done: number, total: number) => void
): Promise<AnomalyRecord[]> {
  const [rewards, entityMap] = await Promise.all([
    fetchRewards(range),
    getEntityMap(),
  ])

  const uniqueIds = [...new Set(rewards.map(r => r.RecordId).filter(Boolean))]
  const orphanIds = new Set<string>()

  let done = 0
  onProgress(0, uniqueIds.length)

  // Check in parallel batches of 10
  const batches = chunkArray(uniqueIds, 10)
  for (const batch of batches) {
    await Promise.all(
      batch.map(async id => {
        try {
          const result = await dataService.retrieve(id)
          if (!result?.record) orphanIds.add(id)
        } catch (err) {
          if (err instanceof MagentrixError) orphanIds.add(id)
        } finally {
          done++
          onProgress(done, uniqueIds.length)
        }
      })
    )
  }

  const anomalies: AnomalyRecord[] = []
  for (const r of rewards) {
    if (orphanIds.has(r.RecordId)) {
      const prefix = r.RecordId?.slice(0, 3) ?? 'UNK'
      const info = resolveEntity(prefix, entityMap)
      anomalies.push({
        reward: r,
        entityLabel: info.label,
        isOrphan: true,
        isHighValue: Number(r.Value) > 0,
      })
    }
  }

  return anomalies.sort((a, b) => Number(b.reward.Value) - Number(a.reward.Value))
}

// TRENDS — group by month
export async function getTrends(range: DateRange): Promise<TrendMonth[]> {
  const [rewards, entityMap] = await Promise.all([
    fetchRewards(range),
    getEntityMap(),
  ])

  const months: Record<string, TrendMonth> = {}

  for (const r of rewards) {
    const month = r.CreatedOn?.slice(0, 7) ?? 'unknown'
    const prefix = r.RecordId?.slice(0, 3) ?? 'UNK'
    const info = resolveEntity(prefix, entityMap)

    if (!months[month]) {
      const [y, m] = month.split('-')
      const label = new Date(Number(y), Number(m) - 1, 1)
        .toLocaleString('default', { month: 'short', year: 'numeric' })
      months[month] = { month, label, total: 0, value: 0, byEntity: {} }
    }

    const tm = months[month]
    tm.total++
    tm.value += Number(r.Value) || 0

    if (!tm.byEntity[info.label]) {
      tm.byEntity[info.label] = { count: 0, value: 0 }
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    tm.byEntity[info.label]!.count++
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    tm.byEntity[info.label]!.value += Number(r.Value) || 0
  }

  return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}
