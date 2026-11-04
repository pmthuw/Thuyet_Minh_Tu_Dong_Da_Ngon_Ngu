// Đặt VITE_API_BASE_URL trong file .env.local, ví dụ: http://127.0.0.1:8080/api
import { getBase } from './adminApi.js'
const API_BASE_URL = getBase()
export const hasApi = Boolean(API_BASE_URL)

// Mọi request có timeout 8s + hỗ trợ huỷ (AbortController) để tránh treo UI
async function request(path, { signal, ...options } = {}, errorMessage = 'Lỗi kết nối') {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  const onAbort = () => ctrl.abort()
  if (signal?.aborted) ctrl.abort()
  else signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const res = await fetch(`${getBase()}${path}`, { ...options, signal: ctrl.signal })
    if (!res.ok) throw new Error(errorMessage)
    return await res.json()
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const getPois = (opts) => request('/pois', opts, 'Không thể tải danh sách địa điểm')
export const getPoi = (id, opts) => request(`/pois/${id}`, opts, 'Không thể tải thông tin địa điểm')
export const getRoute = (origin, destination, opts) => request('/route', { ...post({ origin, destination }), ...opts }, 'Không thể tạo tuyến đường')
export const translate = (text, targetLanguage, { sourceLanguage, ...opts } = {}) =>
  request('/translate', { ...post({ text, targetLanguage, ...(sourceLanguage ? { sourceLanguage } : {}) }), ...opts }, 'Không thể dịch nội dung')

// URL do backend xác nhận; không cần Google API key.
export const getGoogleDirectionsLink = (origin, destination, mode, language, opts) =>
  request('/route/google-link', {
    ...post({ origin, destination, mode, language }), ...opts,
  }, 'Không thể tạo liên kết chỉ đường')

export const getLanguages = (opts) => request('/languages', opts, 'Không thể tải danh sách ngôn ngữ')
