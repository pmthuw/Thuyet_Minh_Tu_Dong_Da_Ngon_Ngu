import { browserUuid } from './browserUuid.js'
export const getBase = () => (localStorage.getItem('auralis:adminApi') || import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
export const deviceId = () => {
 let id = localStorage.getItem('auralis:deviceId')
 if (!id) { id = browserUuid(); localStorage.setItem('auralis:deviceId', id) }
 return id
}
export const deviceName = () => {
 const ua = navigator.userAgent
 const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox/.test(ua) ? 'Firefox' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Trình duyệt'
 const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : 'Linux'
 return `${browser} · ${os}`
}
export async function api(path, { method = 'GET', body, token = sessionStorage.getItem('auralis:adminToken'), signal } = {}) {
 const headers = { Accept: 'application/json' }
 if (token) headers.Authorization = `Bearer ${token}`
 if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
 const controller = new AbortController()
 const timer = setTimeout(() => controller.abort(), 35000)
 const cancel = () => controller.abort()
 if (signal?.aborted) cancel()
 else signal?.addEventListener('abort', cancel, { once: true })
 let response
 try {
  response = await fetch(`${getBase()}${path}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, signal: controller.signal })
 } finally {
  clearTimeout(timer)
  signal?.removeEventListener('abort', cancel)
 }
 if (!response.ok) {
  let problem = {}; try { problem = await response.json() } catch { /* no JSON */ }
  const error = new Error(problem.detail || Object.values(problem.errors || {}).flat().join(' ') || problem.title || (response.status === 401 ? 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.' : `Yêu cầu thất bại (${response.status}).`))
  error.status = response.status; throw error
 }
 return response.status === 204 ? null : response.json()
}
let visitorPromise
async function visitor() {
 const cached = JSON.parse(sessionStorage.getItem('auralis:visitor') || 'null')
 if (cached && Date.parse(cached.expiresAt + (cached.expiresAt.endsWith('Z') ? '' : 'Z')) > Date.now()) return cached.token
 if (!visitorPromise) visitorPromise = api('/telemetry/session', { method: 'POST', token: '', body: { deviceId: deviceId(), deviceName: deviceName() } }).then(x => { sessionStorage.setItem('auralis:visitor', JSON.stringify(x)); return x.token }).finally(() => { visitorPromise = null })
 return visitorPromise
}
export async function trackPlayback(poiId, languageCode, sourceLanguageCode) {
 const token = await visitor()
 const body = { eventId: browserUuid(), poiId, languageCode, sourceLanguageCode }
 // Retry the same event ID: a retry cannot increase the count twice.
 for (let attempt = 0; attempt < 2; attempt++) {
  try { await api('/telemetry/playback', { method: 'POST', token, body }); return }
  catch (e) { if (e.status && e.status < 500) throw e; if (attempt === 1) throw e }
 }
}
export const mediaUrl = url => !url ? '' : url.startsWith('/uploads/') ? `${new URL(getBase(), location.origin).origin}${url}` : url

// One presence loop per page, including React StrictMode's setup/cleanup cycle.
let presenceUsers = 0, presenceStop, presenceRequest
export function startVisitorPresence() {
 presenceUsers++
 if (!presenceStop) {
  const ping = () => {
   if (document.visibilityState === 'hidden' || presenceRequest) return
   presenceRequest = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
     try {
      const token = await visitor()
      await api('/telemetry/heartbeat', { method: 'POST', token })
      return
     } catch (error) {
      if (error.status !== 401 || attempt === 1) throw error
      sessionStorage.removeItem('auralis:visitor')
     }
    }
   })().catch(() => { /* Retry on next heartbeat; browsing remains available. */ })
    .finally(() => { presenceRequest = null })
  }
  const interval = setInterval(ping, 30000)
  document.addEventListener('visibilitychange', ping)
  window.addEventListener('pageshow', ping)
  presenceStop = () => {
   clearInterval(interval)
   document.removeEventListener('visibilitychange', ping)
   window.removeEventListener('pageshow', ping)
  }
  ping()
 }
 let stopped = false
 return () => {
  if (stopped) return
  stopped = true
  presenceUsers--
  if (presenceUsers === 0) { presenceStop?.(); presenceStop = null }
 }
}
