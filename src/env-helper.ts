import type { MagentrixConfig } from "@magentrix-corp/magentrix-sdk"

export const magentrixConfig: MagentrixConfig = {
    baseUrl: import.meta.env.MODE === 'development' ? '/proxy' : import.meta.env.VITE_SITE_URL,
    refreshToken: import.meta.env.VITE_REFRESH_TOKEN,
    isDevMode: import.meta.env.MODE === 'development'
}

export const env = {
    ...magentrixConfig,
    assets: import.meta.env.VITE_ASSETS ? JSON.parse(import.meta.env.VITE_ASSETS) : undefined
}