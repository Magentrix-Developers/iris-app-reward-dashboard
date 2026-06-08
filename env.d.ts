/// <reference types="vite/client" />

declare module '@magentrix-corp/magentrix-sdk' {
  export class MagentrixClient {
    constructor(config: MagentrixConfig)
    getUserInfo(): Promise<UserInfo>
    query(query: string): Promise<{ data: any[] | any }>
    retrieve(id: string): Promise<{ record: any } | null>
    create(entityName: string, data: any): Promise<any>
    edit(entityName: string, data: any): Promise<any>
    delete(entityName: string, id: string, permanent?: boolean): Promise<any>
    execute(path: string, model?: any, method?: any): Promise<any>
    getIrisAppAccessInfo(appSlug: string, checkAppAccess?: boolean): Promise<{ hasAccess: boolean; [key: string]: any }>
    forwardToUnauthorizedPath(info: any): void
  }

  export class MagentrixError extends Error {}
  export class DatabaseError extends MagentrixError {
    hasErrors(): boolean
    getErrors(): Array<{ fieldName: string; message: string; code: string }>
  }

  export interface MagentrixConfig {
    baseUrl: string
    refreshToken?: string
    isDevMode?: boolean
  }

  export interface UserInfo {
    name: string
    userName: string
    id: string
    guest: boolean
    impr: boolean
    preferred_currency: string
    user_timezone: number
    userCurrencySymbol: string
    lang: string
    roleType: string
    locale: string
    display_user_currency: boolean
  }

  export interface SessionInfo {
    token: string
    expires_in: number
  }

  export enum RequestMethod {
    get = 'GET',
    post = 'POST',
  }
}

declare module '@magentrix-corp/magentrix-sdk/vue' {
  import type { MagentrixConfig } from '@magentrix-corp/magentrix-sdk'
  import { MagentrixClient } from '@magentrix-corp/magentrix-sdk'

  export function useMagentrixSdk(): {
    getInstance(config: MagentrixConfig): MagentrixClient
  }

  export { RequestMethod } from '@magentrix-corp/magentrix-sdk'
}
