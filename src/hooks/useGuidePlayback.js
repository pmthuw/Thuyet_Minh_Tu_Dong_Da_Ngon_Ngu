import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSpeech } from './index.js'
import { mediaUrl } from '../services/adminApi.js'

// Imported SQL may contain documentation URLs, which are not actual audio files.
export function canLoadAudioFile(url) {
  if (!url) return false
  if (url.startsWith('/uploads/')) return true
  try {
    const parsed = new URL(url)
    const reserved = ['example.com', 'example.net', 'example.org']
      .some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain))
    return parsed.protocol === 'https:' && !reserved
  } catch { return false }
}

export function useGuidePlayback(text, locale, url, contextKey, onStarted) {
  const key = JSON.stringify([contextKey, url || '', text, locale])
  const callback = useRef(onStarted)
  callback.current = onStarted
  const speech = useSpeech(text, locale, key, onStarted)
  const audio = useRef(null)
  const counted = useRef(false)
  const requested = useRef(false)
  const pendingFallback = useRef(null)
  const speechToggle = useRef(speech.toggle)
  speechToggle.current = speech.toggle
  const [failedKey, setFailedKey] = useState(null)
  const [state, setState] = useState({ key: '', playing: false, progress: 0, duration: 0, error: '' })
  const [rate, setRate] = useState(1)
  const useFile = canLoadAudioFile(url) && failedKey !== key

  useLayoutEffect(() => {
    counted.current = false
    requested.current = false
    setState({ key, playing: false, progress: 0, duration: 0, error: '' })
    if (!useFile) return
    let active = true
    const player = new Audio(mediaUrl(url))
    audio.current = player
    player.preload = 'metadata'
    const update = patch => { if (active) setState(s => ({ ...s, ...patch })) }
    const fail = () => {
      if (!active) return
      // Retry a failed initial start with TTS. If a file already played partly,
      // wait for a new click so it is not restarted unexpectedly or counted twice.
      pendingFallback.current = requested.current && !counted.current ? key : null
      requested.current = false
      player.pause()
      setFailedKey(key)
    }
    player.onloadedmetadata = () => update({ duration: Number.isFinite(player.duration) ? player.duration : 0 })
    player.ontimeupdate = () => update({ progress: player.duration ? player.currentTime / player.duration : 0 })
    player.onplaying = () => {
      update({ playing: true, error: '' })
      if (!counted.current && active) { counted.current = true; callback.current?.() }
    }
    player.onpause = () => update({ playing: false })
    player.onended = () => { counted.current = false; requested.current = false; update({ playing: false, progress: 0 }) }
    player.onerror = fail
    player.auralisFail = fail
    return () => {
      active = false
      player.onloadedmetadata = null
      player.ontimeupdate = null
      player.onplaying = null
      player.onpause = null
      player.onended = null
      player.onerror = null
      player.auralisFail = null
      player.pause()
      player.removeAttribute('src')
      player.load()
      audio.current = null
    }
  }, [key, useFile])

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = rate
  }, [rate, key, useFile])

  useEffect(() => {
    if (!useFile && pendingFallback.current === key) {
      pendingFallback.current = null
      speechToggle.current()
    }
  }, [key, useFile])

  if (!useFile) return { ...speech, fileFallback: !!url }
  return {
    ...(state.key === key ? state : { playing: false, progress: 0, duration: 0, error: '' }),
    supported: true, voiceAvailable: true, rate,
    stop: () => {
      pendingFallback.current = null
      requested.current = false
      counted.current = false
      const player = audio.current
      if (player) { player.pause(); player.currentTime = 0 }
      setState(s => ({ ...s, playing: false, progress: 0 }))
    },
    cycleRate: () => setRate(r => r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1),
    toggle: () => {
      const player = audio.current
      if (!player) return
      if (player.paused) {
        if (player.ended) player.currentTime = 0
        requested.current = true
        player.play().catch(error => {
          if (audio.current !== player || error?.name === 'AbortError') return
          player.auralisFail?.()
        })
      } else { requested.current = false; player.pause() }
    },
  }
}
