import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_POS } from '../data'

export function haversine(a, b) {
  const R = 6371000, r = Math.PI / 180
  const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
export const fmtDist = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)
export const walkMin = (m) => Math.max(1, Math.round(m / 80)) // ~4.8 km/h
export const norm = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase()

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* private mode */ } }, [key, value])
  return [value, setValue]
}

export function useToast() {
  const [msg, setMsg] = useState('')
  const timer = useRef()
  useEffect(() => () => clearTimeout(timer.current), [])
  const show = useCallback((text) => {
    clearTimeout(timer.current)
    setMsg(text)
    timer.current = setTimeout(() => setMsg(''), 2600)
  }, [])
  return [msg, show]
}

export function useGeo() {
  const [pos, setPos] = useState(DEFAULT_POS)
  const [status, setStatus] = useState('default')
  const locate = useCallback(() => {
    if (!navigator.geolocation) return setStatus('denied')
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const c = { lat: p.coords.latitude, lng: p.coords.longitude }
        setPos(c); setStatus('ok')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])
  return { pos, status, locate }
}

// Đọc thuyết minh bằng Web Speech API (không cần backend/API key)
export function useSpeech(text, locale) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [state, setState] = useState({ playing: false, progress: 0 })
  const [rate, setRate] = useState(1)

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setState({ playing: false, progress: 0 })
  }, [supported])

  useEffect(() => stop, [text, locale, rate, stop]) // đổi nội dung/ngôn ngữ/tốc độ → dừng

  const toggle = useCallback(() => {
    if (!supported) return false
    const s = window.speechSynthesis
    if (state.playing) { s.pause(); setState((v) => ({ ...v, playing: false })); return true }
    if (s.paused && s.speaking) { s.resume(); setState((v) => ({ ...v, playing: true })); return true }
    s.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = locale; u.rate = rate
    const voice = s.getVoices().find((v) => v.lang.replace('_', '-').startsWith(locale.slice(0, 2)))
    if (voice) u.voice = voice
    u.onboundary = (e) => setState({ playing: true, progress: Math.min(1, e.charIndex / text.length) })
    u.onend = u.onerror = () => setState({ playing: false, progress: 0 })
    setState({ playing: true, progress: 0 })
    s.speak(u)
    return true
  }, [supported, state.playing, text, locale, rate])

  const cycleRate = () => setRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1))
  return { ...state, supported, rate, toggle, cycleRate, stop }
}
