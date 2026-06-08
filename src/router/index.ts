import { createRouter, createWebHistory } from 'vue-router'
import { magentrixConfig } from '@/env-helper'
import { useMagentrixSdk } from '@magentrix-corp/magentrix-sdk/vue'
import { config } from '@/config'
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/combined-report',
    name: 'combined-report',
    component: () => import('@/views/CombinedReportView.vue'),
  },
  {
    path: '/user-attribution',
    name: 'user-attribution',
    component: () => import('@/views/UserAttributionView.vue'),
  },
  {
    path: '/program-performance',
    name: 'program-performance',
    component: () => import('@/views/ProgramPerformanceView.vue'),
  },
  {
    path: '/anomaly-report',
    name: 'anomaly-report',
    component: () => import('@/views/AnomalyReportView.vue'),
  },
  {
    path: '/trends',
    name: 'trends',
    component: () => import('@/views/TrendsView.vue'),
  },
]

export function createAppRouter(basePath: string) {
  const router = createRouter({
    history: createWebHistory(basePath),
    routes,
  })

  router.beforeEach(async (to, from) => {
    const sdk = useMagentrixSdk().getInstance(magentrixConfig)
    const appAccessInfo = await sdk.getIrisAppAccessInfo(config.appSlug)
    const hasAccess = appAccessInfo.hasAccess ?? false

    if (!hasAccess)
      sdk.forwardToUnauthorizedPath(appAccessInfo)

    return hasAccess
  })

  return router
}
