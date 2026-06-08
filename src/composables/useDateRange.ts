import { ref, provide, inject, type InjectionKey } from 'vue'
import type { DateRange } from '@/types/reward.types'

const DATE_RANGE_KEY: InjectionKey<ReturnType<typeof createDateRange>> = Symbol('dateRange')

function getDefaultRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 6)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

function createDateRange() {
  const range = ref<DateRange>(getDefaultRange())

  function setRange(newRange: DateRange) {
    range.value = newRange
  }

  function reset() {
    range.value = getDefaultRange()
  }

  return { range, setRange, reset }
}

export function provideDateRange() {
  const state = createDateRange()
  provide(DATE_RANGE_KEY, state)
  return state
}

export function useDateRange() {
  const state = inject(DATE_RANGE_KEY)
  if (!state) throw new Error('useDateRange: must be called inside a component tree where provideDateRange() was called')
  return state
}
