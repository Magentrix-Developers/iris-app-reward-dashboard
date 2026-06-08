export interface Reward {
  Id: string
  Name: number
  RecordId: string
  UserId: string
  ProgramId: string
  RewardActivityId: string
  RewardType: string
  Status: 'Approved' | 'Pending' | 'Failed' | string
  Value: number
  IsoCurrencyCode: string
  AssignmentMethod: string
  PaymentType: string
  PayoutTransactionId: string
  ApprovalOrRejectionDate: string
  Comment: string
  Reason: string
  FailedReason: string
  AdditionalData: string
  TotalPointsRedeemed: number
  OwnerId: string
  CreatedById: string
  CreatedOn: string
  ModifiedById: string
  ModifiedOn: string
  IsDeleted: boolean
}

export interface RewardProgram {
  Id: string
  Name: string
}

export interface RewardActivity {
  Id: string
  Name: string
}

export interface UserRecord {
  Id: string
  Name: string
  Email?: string
}

export interface EntityInfo {
  keyPrefix: string
  entityName: string
  label: string
}

// Key prefix → entity name map (known entries for ShieldTek portal)
export const ENTITY_PREFIX_MAP: Record<string, EntityInfo> = {
  '7OP': { keyPrefix: '7OP', entityName: 'LoginHistory', label: 'Login History' },
  '006': { keyPrefix: '006', entityName: 'Opportunity', label: 'Opportunity' },
  '001': { keyPrefix: '001', entityName: 'Account', label: 'Account' },
  '003': { keyPrefix: '003', entityName: 'Contact', label: 'Contact' },
  '00Q': { keyPrefix: '00Q', entityName: 'Lead', label: 'Lead' },
  '01A': { keyPrefix: '01A', entityName: 'Reward', label: 'Reward' },
  '01B': { keyPrefix: '01B', entityName: 'RewardActivity', label: 'Reward Activity' },
  '01E': { keyPrefix: '01E', entityName: 'RewardProgram', label: 'Reward Program' },
  '7NT': { keyPrefix: '7NT', entityName: 'User', label: 'User' },
}

export interface DateRange {
  start: string   // ISO date string YYYY-MM-DD
  end: string     // ISO date string YYYY-MM-DD
}

// Home screen entity group
export interface EntityGroup {
  keyPrefix: string
  entityName: string
  label: string
  rewardCount: number
  totalValue: number
  currency: string
}

// Combined report row
export interface FusedReward extends Reward {
  entityLabel: string
  entityName: string
  linkedRecordName?: string
  userName?: string
  programName?: string
}

// User attribution
export interface UserAttribution {
  userId: string
  userName: string
  rewardCount: number
  totalValue: number
  rewards: FusedReward[]
}

// Program performance
export interface ProgramPerformance {
  programId: string
  programName: string
  totalRewards: number
  totalValue: number
  approved: number
  pending: number
  failed: number
  entityBreakdown: { label: string; count: number }[]
}

// Anomaly
export interface AnomalyRecord {
  reward: Reward
  entityLabel: string
  isOrphan: boolean
  isHighValue: boolean
}

// Trend data
export interface TrendMonth {
  month: string       // e.g. "2024-06"
  label: string       // e.g. "Jun 2024"
  total: number
  value: number
  byEntity: Record<string, { count: number; value: number }>
}
