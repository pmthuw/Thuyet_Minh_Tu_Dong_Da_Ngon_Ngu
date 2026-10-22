import { useEffect, useMemo, useRef, useState } from 'react'
import { CATS, DEFAULT_POS } from '../data'

// Bản đồ đường phố dùng các ô bản đồ OpenStreetMap (không cần API key / thư viện ngoài).
// Chỉ sử dụng tile server công cộng cho demo/đồ án quy mô nhỏ; cần provider riêng khi triển khai lớn.
const SIZE = 256
const RAD = Math.PI / 180
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const valid = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
function project(p, z) {
  const max = SIZE * 2 ** z
  const lat = clamp(p.lat, -85.05112878, 85.05112878) * RAD
  return { x: (p.lng + 180) / 360 * max, y: (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * max }
}
function unproject(x, y, z) {
  const max = SIZE * 2 ** z
  return { lng: x / max * 360 - 180, lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * y / max))) / RAD }
}
function fit(points, size, maxZoom = 16) {
  if (!points?.length) return null
  const all = points.filter(valid)
  if (!all.length) return null
  const minLat = Math.min(...all.map((p) => p.lat)), maxLat = Math.max(...all.map((p) => p.lat))
  const minLng = Math.min(...all.map((p) => p.lng)), maxLng = Math.max(...all.map((p) => p.lng))
  const width = Math.max(150, size.w - 110)
  const height = Math.max(130, size.h - (size.h > 530 ? 280 : 205))
  let zoom = maxZoom
  for (; zoom > 3; zoom--) {
    const a = project({ lat: minLat, lng: minLng }, zoom)
    const b = project({ lat: maxLat, lng: maxLng }, zoom)
    if (Math.abs(b.x - a.x) <= width && Math.abs(b.y - a.y) <= height) break
  }
  const a = project({ lat: minLat, lng: minLng }, zoom), b = project({ lat: maxLat, lng: maxLng }, zoom)
  const mid = unproject((a.x + b.x) / 2, (a.y + b.y) / 2, zoom)
  // Dịch tâm lên một chút để không che tuyến bởi thẻ chi tiết địa điểm bên dưới.
  const up = unproject(project(mid, zoom).x, project(mid, zoom).y + (size.h > 530 ? 65 : 38), zoom)
  return { center: up, zoom }
}

export default function StreetRouteMap({ pois, selectedId, selected, user, showUser, route, origin, onSelect, labels }) {
  const el = useRef(null)
  const gesture = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 650 })
  const [view, setView] = useState({ center: DEFAULT_POS, zoom: 14 })
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!el.current) return
    const observer = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    observer.observe(el.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (route?.path?.length) {
      const next = fit(route.path, size)
      if (next) setView(next)
    } else if (valid(selected)) {
      const next = fit(showUser && valid(user) ? [selected, user] : [selected], size)
      if (next) setView(next)
    }
  }, [route, selected?.id, showUser, user?.lat, user?.lng, size.w, size.h]) // eslint-disable-line react-hooks/exhaustive-deps

  const centerPx = project(view.center, view.zoom)
  const toScreen = (p) => {
    const w = project(p, view.zoom)
    return { x: w.x - centerPx.x + size.w / 2, y: w.y - centerPx.y + size.h / 2 }
  }
  const tiles = useMemo(() => {
    const count = 2 ** view.zoom
    const left = centerPx.x - size.w / 2, top = centerPx.y - size.h / 2
    const xs = [Math.floor(left / SIZE) - 1, Math.floor((left + size.w) / SIZE) + 1]
    const ys = [Math.floor(top / SIZE) - 1, Math.floor((top + size.h) / SIZE) + 1]
    const result = []
    for (let x = xs[0]; x <= xs[1]; x++) for (let y = ys[0]; y <= ys[1]; y++) {
      if (y < 0 || y >= count) continue
      result.push({ id: `${view.zoom}/${x}/${y}`, src: `https://tile.openstreetmap.org/${view.zoom}/${(x % count + count) % count}/${y}.png`, left: x * SIZE - left, top: y * SIZE - top })
    }
    return result
  }, [view, size.w, size.h]) // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = (factor) => setView((v) => ({ ...v, zoom: clamp(v.zoom + factor, 3, 18) }))
  const start = (e) => {
    if (e.target.closest('button, a')) return
    gesture.current = { x: e.clientX, y: e.clientY, center: project(view.center, view.zoom) }
    el.current?.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const move = (e) => {
    if (!gesture.current) return
    const { x, y, center } = gesture.current
    setView((v) => ({ ...v, center: unproject(center.x - (e.clientX - x), center.y - (e.clientY - y), v.zoom) }))
  }
  const stop = () => { gesture.current = null; setDragging(false) }
  useEffect(() => {
    const node = el.current
    if (!node) return
    const wheel = (event) => { event.preventDefault(); zoom(event.deltaY < 0 ? 1 : -1) }
    node.addEventListener('wheel', wheel, { passive: false })
    return () => node.removeEventListener('wheel', wheel)
  }, [])
  const line = route?.path?.map((p) => {
    const { x, y } = toScreen(p)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  return (
    <div ref={el} className={`street-map ${dragging ? 'is-dragging' : ''}`} role="region" aria-label={labels.map}
      onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop}>
      <div className="street-tiles" aria-hidden="true">
        {tiles.map((tile) => <img key={tile.id} src={tile.src} alt="" draggable="false" loading="lazy"
          style={{ left: tile.left, top: tile.top }} />)}
      </div>
      {line && <svg className="street-route" viewBox={`0 0 ${size.w} ${size.h}`} aria-hidden="true">
        <polyline points={line} fill="none" stroke="#fff" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={line} fill="none" stroke="#0b7b72" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
      </svg>}
      {pois.filter(valid).map((p) => {
        const { x, y } = toScreen(p)
        if (x < -60 || y < -60 || x > size.w + 60 || y > size.h + 60) return null
        return <button type="button" key={p.id} className={`street-pin ${p.id === selectedId ? 'is-selected' : ''}`}
          onClick={() => onSelect(p.id)} style={{ left: x, top: y, '--pin-color': CATS[p.cat]?.color || '#0e6b68' }}
          title={p.name} aria-label={p.name}><span className="street-pin-dot" />
          {p.id === selectedId && <span className="street-pin-label">{p.name}</span>}
        </button>
      })}
      {showUser && valid(user) && !route && <div className="street-origin-pin" style={{ left: toScreen(user).x, top: toScreen(user).y }} title={labels.you} />}
      {valid(origin) && route && <div className="street-origin-pin" style={{ left: toScreen(origin).x, top: toScreen(origin).y }} title={labels.origin} />}
      <div className="street-zoom" role="group" aria-label={labels.zoom}>
        <button type="button" onClick={() => zoom(1)} title={labels.zoomIn}>+</button>
        <button type="button" onClick={() => zoom(-1)} title={labels.zoomOut}>−</button>
        <button type="button" onClick={() => setView(fit(route?.path?.length ? route.path : selected ? [selected] : pois, size) || view)} title={labels.fit}>⌖</button>
      </div>
      <span className="street-credit">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors</span>
    </div>
  )
}
