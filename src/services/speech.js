// Never let an unrelated default voice silently read another language.
export const normalizeLocale = (locale = '') => locale.replaceAll('_', '-').toLowerCase()

export function selectVoice(voices, locale) {
  const target = normalizeLocale(locale)
  if (!target) return null
  return voices.find((v) => normalizeLocale(v.lang) === target)
    || voices.find((v) => normalizeLocale(v.lang).split('-')[0] === target.split('-')[0])
    || null
}

export function resolveNarration(poi, language) {
  const translations = poi?.tr || {}
  const keys = [language.locale, language.code].map(normalizeLocale)
  for (const key of keys) {
    const entry = Object.entries(translations).find(([code, text]) =>
      normalizeLocale(code) === key && typeof text === 'string' && text.trim())
    if (entry) return { text: entry[1], locale: language.locale, languageCode: poi?.guideLanguages?.[entry[0]] || entry[0] }
  }
  return { text: '', locale: language.locale }
}

export function speechMessage(error, t) {
  return ({ 'missing-text': t.noTranslation, 'missing-voice': t.noVoice,
    unsupported: t.noTts, 'speech-error': t.speechError })[error] || ''
}

export class SpeechController {
  constructor(synth, Utterance, onChange = () => {}, onStarted = () => {}) {
    this.synth = synth
    this.Utterance = Utterance
    this.onChange = onChange
    this.onStarted = onStarted
    this.text = ''
    this.locale = ''
    this.rate = 1
    this.playing = false
    this.progress = 0
    this.error = ''
    this.utterance = null
    this.generation = 0
    this.refreshVoices = () => this.emit()
    synth.addEventListener('voiceschanged', this.refreshVoices)
  }

  snapshot() {
    const voice = selectVoice(this.synth.getVoices(), this.locale)
    return { playing: this.playing, progress: this.progress, error: this.error,
      voiceAvailable: !!voice, voiceName: voice?.name || '' }
  }

  emit() { this.onChange(this.snapshot()) }

  stop() {
    this.generation += 1 // late callbacks from cancelled speech must be ignored
    this.utterance = null
    this.synth.cancel()
    if (this.synth.paused) this.synth.resume()
    this.playing = false
    this.progress = 0
    this.error = ''
    this.emit()
  }

  update(text, locale, rate, contextKey = '') {
    if (text === this.text && locale === this.locale && rate === this.rate && contextKey === this.contextKey) return
    this.contextKey = contextKey
    this.text = text || ''
    this.locale = locale
    this.rate = rate
    this.stop()
  }

  toggle() {
    if (!this.text.trim()) { this.error = 'missing-text'; this.emit(); return false }
    const voice = selectVoice(this.synth.getVoices(), this.locale)
    if (!voice) { this.stop(); this.error = 'missing-voice'; this.emit(); return false }
    if (this.playing) {
      this.synth.pause(); this.playing = false; this.emit(); return true
    }
    if (this.utterance && this.synth.paused && this.synth.speaking) {
      this.synth.resume(); this.playing = true; this.emit(); return true
    }
    this.stop()
    const token = this.generation
    const utterance = new this.Utterance(this.text)
    this.utterance = utterance
    utterance.lang = this.locale
    utterance.voice = voice
    utterance.rate = this.rate
    const active = () => token === this.generation && this.utterance === utterance
    let recorded = false
    utterance.onstart = () => {
      if (active() && !recorded) { recorded = true; this.onStarted() }
    }
    utterance.onboundary = (event) => {
      if (!active()) return
      this.progress = Math.min(1, event.charIndex / this.text.length)
      this.emit()
    }
    utterance.onend = () => {
      if (!active()) return
      this.utterance = null; this.playing = false; this.progress = 0; this.emit()
    }
    utterance.onerror = () => {
      if (!active()) return
      this.utterance = null; this.playing = false; this.progress = 0
      this.error = 'speech-error'; this.emit()
    }
    this.playing = true
    this.emit()
    try {
      this.synth.speak(utterance)
    } catch {
      this.stop(); this.error = 'speech-error'; this.emit(); return false
    }
    return true
  }

  destroy() {
    this.synth.removeEventListener('voiceschanged', this.refreshVoices)
    this.onChange = () => {}
    this.stop()
  }
}
