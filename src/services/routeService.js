// Valhalla OpenStreetMap: định tuyến trên đường thật, không cần tài khoản Google.
// /routing được Vite proxy tới Valhalla, nên chạy được chỉ với `npm run dev`.
// Khuyến nghị cấu hình server riêng cho môi trường production.
const COSTING = { walking: 'pedestrian', driving: 'auto', motorcycle: 'motor_scooter' }

export function decodePolyline6(encoded) {
  let i = 0, lat = 0, lng = 0
  const result = []
  while (i < encoded.length) {
    const read = () => {
      let value = 0, shift = 0, byte
      do {
        if (i >= encoded.length) throw new Error('Đường dẫn không hợp lệ')
        byte = encoded.charCodeAt(i++) - 63
        value |= (byte & 31) << shift
        shift += 5
      } while (byte >= 32)
      return value & 1 ? ~(value >> 1) : value >> 1
    }
    lat += read(); lng += read()
    result.push({ lat: lat / 1e6, lng: lng / 1e6 })
  }
  return result
}

export function makeRouteRequest(origin, destination, mode, language = 'vi') {
  if (!COSTING[mode]) throw new Error('Phương tiện không hợp lệ')
  for (const p of [origin, destination]) {
    if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) {
      throw new Error('Tọa độ điểm đi hoặc điểm đến không hợp lệ')
    }
  }
  const input = {
    locations: [origin, destination].map((p) => ({ lat: p.lat, lon: p.lng })),
    costing: COSTING[mode],
    units: 'kilometers',
    // Không phải ngôn ngữ giao diện nào cũng có hướng dẫn rẽ từ Valhalla.
    language: ({ en: 'en-US', fr: 'fr-FR', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR', vi: 'en-US' })[language] || 'en-US',
    directions_options: { units: 'kilometers' },
  }
  if (mode === 'motorcycle') input.costing_options = { motor_scooter: { top_speed: 60, use_primary: 0.6 } }
  return input
}

// Dịch vụ công cộng có thể giới hạn tần suất; không hiển thị đường chim bay giả như đường thật.
export async function fetchRoute(origin, destination, mode, language, { signal } = {}) {
  const request = makeRouteRequest(origin, destination, mode, language)
  const url = `/routing/route?json=${encodeURIComponent(JSON.stringify(request))}`
  const ctrl = new AbortController()
  const abort = () => ctrl.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`Máy chủ định tuyến trả về lỗi ${res.status}`)
    const data = await res.json()
    const trip = data.trip
    if (!trip?.legs?.length) throw new Error(data.error || 'Không tìm được tuyến đường')
    const path = trip.legs.flatMap((leg, i) => {
      const pts = decodePolyline6(leg.shape || '')
      return i ? pts.slice(1) : pts
    })
    if (path.length < 2) throw new Error('Không nhận được đường đi chi tiết')
    return {
      path,
      distanceMeters: Math.round(trip.summary.length * 1000),
      durationSeconds: Math.round(trip.summary.time),
      mode,
      source: 'Valhalla / OpenStreetMap',
      steps: trip.legs.flatMap((leg) => (leg.maneuvers || []).map((m) => ({
        instruction: m.instruction, distanceMeters: Math.round((m.length || 0) * 1000),
      }))),
    }
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
