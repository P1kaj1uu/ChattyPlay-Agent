const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const configuredApiUrl = import.meta.env.VITE_GOOFISH_API_URL?.trim()
const configuredWebSocketUrl = import.meta.env.VITE_GOOFISH_WS_URL?.trim()

export const GOOFISH_API_URL = configuredApiUrl
  ? trimTrailingSlash(configuredApiUrl)
  : '/api'

function deriveWebSocketUrl(): string {
  if (configuredWebSocketUrl) {
    return trimTrailingSlash(configuredWebSocketUrl)
  }

  if (configuredApiUrl) {
    const backendUrl = new URL(configuredApiUrl)
    backendUrl.protocol = backendUrl.protocol === 'https:' ? 'wss:' : 'ws:'
    backendUrl.pathname = backendUrl.pathname.replace(/\/api\/?$/, '') + '/ws'
    backendUrl.search = ''
    backendUrl.hash = ''
    return backendUrl.toString()
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

export const GOOFISH_WS_URL = deriveWebSocketUrl()
export const GOOFISH_USES_REMOTE_BACKEND = Boolean(configuredApiUrl)
