import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DEFAULT_POS } from '../data'
import { SpeechController } from '../services/speech.js'
import { resolveNarration } from '../services/speech.js'
import { findNarrationSource, loadNarration } from '../services/narration.js'
import { translate } from '../services/api.js'

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

// Voices may load after the page: observe voiceschanged.
export function useSpeech(text, locale, contextKey = '', onStarted) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
  const [state, setState] = useState({ playing: false, progress: 0, error: '', voiceAvailable: false, voiceName: '' })
  const [rate, setRate] = useState(1)
  const controller = useRef(null)
  const startedRef = useRef(onStarted)
  startedRef.current = onStarted

  useLayoutEffect(() => {
    if (!supported) return
    const instance = new SpeechController(window.speechSynthesis, window.SpeechSynthesisUtterance, setState, () => startedRef.current?.())
    controller.current = instance
    return () => { instance.destroy(); controller.current = null }
  }, [supported])

  useLayoutEffect(() => {
    controller.current?.update(text, locale, rate, contextKey)
  }, [text, locale, rate, contextKey, supported])

  const stop = useCallback(() => controller.current?.stop(), [])
  const toggle = useCallback(() => controller.current?.toggle() ?? false, [])
  const cycleRate = useCallback(() => setRate((r) => r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1), [])
  return { ...state, supported, rate, toggle, cycleRate, stop }
}

// Only expose translated text for the currently selected POI/source/language.
export function useNarration(poi, language) {
  const direct = resolveNarration(poi, language)
  const source = findNarrationSource(poi)
  const key = JSON.stringify([poi?.id ?? null, source.text, source.locale, language.locale])
  const cache = useRef(new Map())
  const [result, setResult] = useState({ key: '', text: '', status: 'missing' })

  useEffect(() => {
    if (!poi || direct.text || !source.text) return
    const controller = new AbortController()
    setResult({ key, text: '', status: 'loading' })
    loadNarration(poi, language, translate, { signal: controller.signal, cache: cache.current })
      .then((narration) => {
        if (!controller.signal.aborted) setResult({ key, text: narration.text, status: 'ready' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ key, text: '', status: 'unavailable' })
      })
    return () => controller.abort()
  }, [key, direct.text, source.text]) // key includes POI, language and source content

  if (direct.text) return { ...direct, status: 'ready' }
  if (!poi || !source.text) return { text: '', locale: language.locale, status: 'missing' }
  if (result.key === key) return { text: result.text, locale: language.locale, status: result.status, languageCode: language.code, sourceLanguageCode: source.languageCode }
  return { text: '', locale: language.locale, status: 'loading' }
}
