/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_OPENROUTER_API_KEY: string
  readonly VITE_APIFY_API_KEY: string
  readonly VITE_OUTSCRAPER_API_KEY: string
  readonly VITE_SERPER_API_KEY: string
  readonly VITE_SOCIALPILOT_CLIENT_ID: string
  readonly VITE_SOCIALPILOT_CLIENT_SECRET: string
  readonly VITE_SOCIALPILOT_ACCESS_TOKEN: string
  readonly VITE_GOOGLE_MAPS_API_KEY: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_USE_MOCK_DATA: string
  readonly VITE_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
