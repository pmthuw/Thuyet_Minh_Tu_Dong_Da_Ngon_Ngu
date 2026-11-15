import { normalizeLocale, resolveNarration } from './speech.js'

export function findNarrationSource(poi) {
  // Source text is used only to request a translation, never read as a fallback.
  for (const code of ['vi', 'en']) {
    const entry = Object.entries(poi?.tr || {}).find(([key, text]) =>
      normalizeLocale(key).split('-')[0] === code && typeof text === 'string' && text.trim())
    if (entry) return { text: entry[1], locale: code, languageCode: poi?.guideLanguages?.[entry[0]] || entry[0] }
  }
  const entry = Object.entries(poi?.tr || {}).find(([, text]) => typeof text === 'string' && text.trim())
  if (entry) return { text: entry[1], locale: normalizeLocale(entry[0]).split('-')[0], languageCode: poi?.guideLanguages?.[entry[0]] || entry[0] }
  return { text: '', locale: '' }
}

function checkAborted(signal) {
  if (signal?.aborted) throw new DOMException('Translation cancelled', 'AbortError')
}

export async function loadNarration(poi, language, translate, { signal, cache = new Map() } = {}) {
  checkAborted(signal)
  const direct = resolveNarration(poi, language)
  if (direct.text) return direct
  const source = findNarrationSource(poi)
  if (!source.text) throw new Error('No source narration')
  // Include source content: two POIs sharing an ID must never share unrelated translations.
  const key = JSON.stringify([source.text, source.locale, language.code])
  if (cache.has(key)) return { text: cache.get(key), locale: language.locale }
  const result = await translate(source.text, language.code, { signal, sourceLanguage: source.locale })
  checkAborted(signal)
  const target = normalizeLocale(result?.targetLanguage).split('-')[0]
  if (target !== normalizeLocale(language.code).split('-')[0] || typeof result?.translatedText !== 'string' || !result.translatedText.trim()) {
    throw new Error('Invalid translated text or mismatched target language')
  }
  const text = result.translatedText.trim()
  if (text === source.text.trim() && source.locale !== normalizeLocale(language.code).split('-')[0]) {
    throw new Error('Translation returned the unchanged source narration')
  }
  cache.set(key, text)
  return { text, locale: language.locale }
}
