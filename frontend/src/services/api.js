const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7001/api'

export async function getPois() {
  const response = await fetch(`${API_BASE_URL}/pois`)
  if (!response.ok) throw new Error('Không thể tải danh sách địa điểm')
  return response.json()
}

export async function getPoi(id) {
  const response = await fetch(`${API_BASE_URL}/pois/${id}`)
  if (!response.ok) throw new Error('Không thể tải thông tin địa điểm')
  return response.json()
}

export async function getRoute(origin, destination) {
  const response = await fetch(`${API_BASE_URL}/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination }),
  })

  if (!response.ok) throw new Error('Không thể tạo tuyến đường')
  return response.json()
}

export async function translate(text, targetLanguage) {
  const response = await fetch(`${API_BASE_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLanguage }),
  })

  if (!response.ok) throw new Error('Không thể dịch nội dung')
  return response.json()
}
