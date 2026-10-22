// Google Maps URLs API: deep-link thực tế, không cần Maps JavaScript API key.
// GPS chỉ truyền nếu người dùng đã cấp quyền, tránh dùng toạ độ mẫu làm điểm xuất phát.
const valid = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
export function googleDirectionsUrl(destination, { origin = null, mode = 'walking', language = 'vi' } = {}) {
  if (!valid(destination) || !['walking', 'driving', 'motorcycle'].includes(mode)) return null
  const query = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: mode === 'motorcycle' ? 'two-wheeler' : mode === 'driving' ? 'driving' : 'walking',
    hl: language,
  })
  if (valid(origin)) query.set('origin', `${origin.lat},${origin.lng}`)
  return `https://www.google.com/maps/dir/?${query}`
}
export function googleMapEmbedUrl(poi, language = 'vi') {
  const p = valid(poi) ? poi : { lat: 10.7766, lng: 106.7032 }
  const q = new URLSearchParams({ q: `${p.lat},${p.lng}`, z: valid(poi) ? '16' : '14', output: 'embed', hl: language })
  return `https://maps.google.com/maps?${q}`
}
