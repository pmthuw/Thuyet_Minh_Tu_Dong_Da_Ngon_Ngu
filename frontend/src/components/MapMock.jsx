import { useCallback, useEffect, useRef, useState } from 'react'
import { CATS } from '../data'

// Toạ độ thật (lat/lng) → mét quanh gốc, để sau này thay bằng Google Maps chỉ cần giữ props
const L0 = 106.69, LAT0 = 10.785
const toM = (p) => ({ x: (p.lng - L0) * 109400, y: (LAT0 - p.lat) * 110574 })
const MIN_S = 0.2, MAX_S = 3

export default function MapMock({ pois, selectedId, user, routeTo, speaking, onSelect, zoomRef, labels }) {
  const box = useRef(null)
  const drag = useRef(null)
  const [view, setView] = useState(null) // { s, ox, oy }
  const [dragging, setDragging] = useState(false)

  const size = () => { const r = box.current.getBoundingClientRect(); return { w: r.width, h: r.height } }

  // Khởi tạo khung nhìn ôm vừa các địa điểm
  useEffect(() => {
    const { w, h } = size()
    const s = Math.min(w / 1700, h / 1150)
    setView({ s, ox: w / 2 - 887 * s, oy: h / 2 - 967 * s })
  }, [])

  const zoom = useCallback((f) => {
    setView((v) => {
      if (!v) return v
      const { w, h } = size()
      const s = Math.min(MAX_S, Math.max(MIN_S, v.s * f)), k = s / v.s
      return { s, ox: w / 2 - (w / 2 - v.ox) * k, oy: h / 2 - (h / 2 - v.oy) * k }
    })
  }, [])
  const centerOn = useCallback((p) => {
    setView((v) => {
      if (!v) return v
      const { w, h } = size(), m = toM(p)
      return { ...v, ox: w / 2 - m.x * v.s, oy: h * 0.42 - m.y * v.s }
    })
  }, [])
  useEffect(() => { if (zoomRef) zoomRef.current = { zoom, centerOn } }, [zoomRef, zoom, centerOn])

  // Chọn địa điểm → dời bản đồ tới đó
  const sel = pois.find((p) => p.id === selectedId)
  useEffect(() => { if (sel) centerOn(sel) }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = box.current
    const onWheel = (e) => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoom])

  const onDown = (e) => {
    if (e.target.closest('button')) return
    drag.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onMove = (e) => {
    if (!drag.current) return
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y
    drag.current = { x: e.clientX, y: e.clientY }
    setView((v) => ({ ...v, ox: v.ox + dx, oy: v.oy + dy }))
  }
  const onUp = () => { drag.current = null; setDragging(false) }
  const onKey = (e) => {
    const step = 60, map = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
    if (map[e.key]) { e.preventDefault(); setView((v) => ({ ...v, ox: v.ox + map[e.key][0], oy: v.oy + map[e.key][1] })) }
    if (e.key === '+' || e.key === '=') zoom(1.25)
    if (e.key === '-') zoom(0.8)
  }

  const at = (p) => { const m = toM(p); return { left: view.ox + m.x * view.s, top: view.oy + m.y * view.s } }
  const u = view && toM(user)

  return (
    <div ref={box} className={`map ${dragging ? 'dragging' : ''}`} onPointerDown={onDown} onPointerMove={onMove}
      onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey} tabIndex={0} role="application" aria-label={labels.map}>
      {view && (
        <>
          <svg className="map-svg" width="100%" height="100%">
            <g transform={`translate(${view.ox} ${view.oy}) scale(${view.s})`}>
              <path className="m-water" d="M1760 -200 C1700 400 1850 800 1770 1200 L1790 1700 L2400 1700 L2400 -200Z" />
              <rect className="m-park" x="260" y="980" width="330" height="190" rx="70" />
              <rect className="m-park" x="880" y="620" width="190" height="130" rx="50" />
              <g className="m-roads" fill="none" strokeLinecap="round">
                <path className="minor" d="M0 1130 L2000 1210 M200 1450 L1700 480 M700 0 L760 1700 M1230 0 L1190 1700" />
                <path className="major" d="M0 720 L2000 640 M300 0 L520 1700 M1020 0 L1130 1700 M0 1000 L1500 1050" />
              </g>
              {routeTo && <line className="m-route" x1={u.x} y1={u.y} x2={toM(routeTo).x} y2={toM(routeTo).y} />}
            </g>
          </svg>

          {pois.map((p) => {
            const isSel = p.id === selectedId
            return (
              <button key={p.id} className={`pin ${isSel ? 'sel' : ''}`} style={{ ...at(p), '--c': CATS[p.cat].color }}
                onClick={() => onSelect(p.id)} aria-label={labels.name(p)} aria-pressed={isSel}>
                {isSel && speaking && <><b className="ring" /><b className="ring r2" /><b className="ring r3" /></>}
                <i />
                {isSel && <em>{labels.name(p)}</em>}
              </button>
            )
          })}

          <div className="me" style={at(user)}><i /></div>
        </>
      )}
      <div className="map-credit">Bản đồ minh họa · thay bằng Google Maps khi có API key</div>
    </div>
  )
}
