/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BAIDU_APP_ID: string
  readonly VITE_BAIDU_SECRET_KEY: string
  readonly VITE_OPENAI_BASE_URL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_GOOFISH_API_URL?: string
  readonly VITE_GOOFISH_WS_URL?: string
  readonly VITE_NEWS_API_BASE_URL: string
  readonly VITE_GAMES_API_URL?: string
  readonly VITE_CONCERT_API_URL?: string
  readonly VITE_CONCERT_OSS_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
