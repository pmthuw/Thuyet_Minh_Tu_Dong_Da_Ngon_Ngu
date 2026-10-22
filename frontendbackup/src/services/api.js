const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
export const hasApi = Boolean(API_BASE_URL)

// Mọi request có timeout 8s + hỗ trợ huỷ (AbortController) để tránh treo UI
async function request(path, { signal, ...options } = {}, errorMessage = 'Lỗi kết nối') {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  signal?.addEventListener('abort', () => ctrl.abort())
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, signal: ctrl.signal })
    if (!res.ok) throw new Error(errorMessage)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

const post = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

export const getPois = (opts) => request('/pois', opts, 'Không thể tải danh sách địa điểm')
export const getPoi = (id, opts) => request(`/pois/${id}`, opts, 'Không thể tải thông tin địa điểm')
export const getRoute = (origin, destination, opts) => request('/route', { ...post({ origin, destination }), ...opts }, 'Không thể tạo tuyến đường')
export const translate = (text, targetLanguage, opts) => request('/translate', { ...post({ text, targetLanguage }), ...opts }, 'Không thể dịch nội dung')
