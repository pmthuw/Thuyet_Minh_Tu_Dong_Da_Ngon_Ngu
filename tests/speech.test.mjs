import test from 'node:test'
import assert from 'node:assert/strict'
import { SpeechController, selectVoice, resolveNarration } from '../src/services/speech.js'
import { POIS, LANGS, UI } from '../src/data.js'

const voice = (lang) => ({ lang, name: `Voice ${lang}` })
function setup(voices = [voice('vi-VN'), voice('en-US'), voice('zh-CN'), voice('ko-KR'), voice('ja-JP'), voice('fr-FR')]) {
  const synth = {
    voices, calls: [], listeners: new Map(), paused: false, speaking: false,
    getVoices() { return this.voices },
    addEventListener(event, cb) { this.listeners.set(event, cb) },
    removeEventListener(event) { this.listeners.delete(event) },
    cancel() { this.speaking = false },
    speak(u) { this.calls.push(u); this.speaking = true },
    pause() { this.paused = true }, resume() { this.paused = false },
  }
  class Utterance { constructor(text) { this.text = text } }
  const changes = []
  return { synth, changes, controller: new SpeechController(synth, Utterance, (s) => changes.push(s)) }
}

test('each selectable language has matching text and explicitly selected voice for every demo POI', () => {
  const { controller, synth } = setup()
  for (const poi of POIS) for (const lang of LANGS) {
    const narration = resolveNarration(poi, lang)
    assert.ok(narration.text.trim())
    controller.update(narration.text, narration.locale, 1)
    assert.equal(controller.toggle(), true)
    const utterance = synth.calls.at(-1)
    assert.equal(utterance.text, poi.tr[lang.code])
    assert.equal(utterance.lang, lang.locale)
    assert.equal(utterance.voice.lang, lang.locale)
  }
})
test('missing requested translation never falls back to Vietnamese or English', () => {
  assert.equal(resolveNarration({tr: {vi: 'Xin chào', en: 'Hello'}}, LANGS[2]).text, '')
  const { controller, synth } = setup()
  controller.update('', 'zh-CN', 1)
  assert.equal(controller.toggle(), false)
  assert.equal(synth.calls.length, 0)
  assert.equal(controller.snapshot().error, 'missing-text')
})
test('SQL Server full locale keys and underscore forms are recognized', () => {
  assert.equal(resolveNarration({tr: {'en-US': 'Hello'}}, LANGS[1]).text, 'Hello')
  assert.equal(resolveNarration({tr: {'ko_KR': '안녕하세요'}}, LANGS[3]).text, '안녕하세요')
})
test('a Vietnamese-only device must not speak English using its default Vietnamese voice', () => {
  const { controller, synth } = setup([voice('vi-VN')])
  controller.update('Hello', 'en-US', 1)
  assert.equal(controller.toggle(), false)
  assert.equal(controller.snapshot().error, 'missing-voice')
  assert.equal(synth.calls.length, 0)
})
test('voices that load later become available without reloading and without autoplay', () => {
  const { controller, synth } = setup([])
  controller.update('Hello', 'en-US', 1)
  assert.equal(controller.snapshot().voiceAvailable, false)
  synth.voices = [voice('en-US')]
  synth.listeners.get('voiceschanged')()
  assert.equal(controller.snapshot().voiceAvailable, true)
  assert.equal(synth.calls.length, 0)
  assert.equal(controller.toggle(), true)
})
test('exact locale has priority; base language fallback never picks an unrelated voice', () => {
  const voices = [voice('vi-VN'), voice('en-GB'), voice('en-US')]
  assert.equal(selectVoice(voices, 'en_US'), voices[2])
  assert.equal(selectVoice(voices, 'en-AU'), voices[1])
  assert.equal(selectVoice(voices, 'ko-KR'), null)
})
test('changing language while paused cancels old speech; stale callbacks cannot alter new playback', () => {
  const { controller, synth } = setup()
  controller.update('Xin chào', 'vi-VN', 1)
  controller.toggle()
  const old = synth.calls[0]
  controller.toggle()
  assert.equal(synth.paused, true)
  controller.update('Hello', 'en-US', 1)
  assert.equal(synth.paused, false)
  assert.equal(controller.snapshot().playing, false)
  controller.toggle()
  old.onend()
  old.onerror()
  old.onboundary({charIndex: 3})
  assert.equal(controller.snapshot().playing, true)
  assert.equal(controller.snapshot().progress, 0)
  assert.equal(synth.calls.at(-1).voice.lang, 'en-US')
})
test('pause/resume uses the same utterance; rate change resets progress and applies new speed', () => {
  const { controller, synth } = setup()
  controller.update('Hello world', 'en-US', 1)
  controller.toggle(); synth.calls[0].onboundary({charIndex: 5})
  controller.toggle(); controller.toggle()
  assert.equal(synth.calls.length, 1)
  controller.update('Hello world', 'en-US', 1.25)
  assert.equal(controller.snapshot().progress, 0)
  controller.toggle()
  assert.equal(synth.calls.at(-1).rate, 1.25)
})
test('unmount removes voice listeners and ignores delayed events', () => {
  const { controller, synth, changes } = setup()
  controller.update('Hello', 'en-US', 1); controller.toggle()
  const old = synth.calls[0]
  controller.destroy()
  const count = changes.length
  old.onend()
  assert.equal(changes.length, count)
  assert.equal(synth.listeners.size, 0)
  assert.equal(synth.speaking, false)
})
test('all six UI languages provide every label and narration availability message', () => {
  for (const lang of LANGS) for (const key of Object.keys(UI.en).filter((k) => k !== 'fallback')) {
    assert.ok(UI[lang.code][key], `${lang.code}: ${key}`)
  }
})

test('switching POI cancels playback even when both places have identical narration text', () => {
  const { controller, synth } = setup()
  controller.update('Hello', 'en-US', 1, 'poi-1'); controller.toggle()
  const old = synth.calls[0]
  controller.update('Hello', 'en-US', 1, 'poi-2')
  assert.equal(synth.speaking, false)
  old.onboundary({charIndex: 2})
  assert.equal(controller.snapshot().playing, false)
})


test('playback is recorded once only when audio actually starts, including pause/resume and POI switches', () => {
  const { controller, synth } = setup()
  let plays = 0
  controller.onStarted = () => plays++
  controller.update('Hello world', 'en-US', 1, 'poi-1')
  controller.toggle()
  const u = synth.calls.at(-1)
  assert.equal(plays, 0)
  u.onstart(); u.onstart()
  assert.equal(plays, 1)
  controller.toggle(); controller.toggle(); u.onstart()
  assert.equal(plays, 1)
  controller.update('Hello world', 'en-US', 1, 'poi-2')
  u.onstart()
  assert.equal(plays, 1, 'late start on the previous POI must be ignored')
  controller.toggle(); synth.calls.at(-1).onstart()
  assert.equal(plays, 2)
})
test('legacy aliases resolve to the actual SQL language key for counting', () => {
  const p = {tr: {en:'Hello'}, guideLanguages: {en:'en-US'}}
  assert.equal(resolveNarration(p, {code:'en',locale:'en'}).languageCode, 'en-US')
})
