import test from 'node:test'
import assert from 'node:assert/strict'
import { loadNarration } from '../src/services/narration.js'
const en = {code:'en', locale:'en-US'}
const fr = {code:'fr', locale:'fr-FR'}
const poi = {id: 1, tr: {'vi-VN': 'Thuyết minh thực tế', vi: 'Thuyết minh thực tế', 'en-US': 'Real stored narration'}}

test('stored SQL full-locale translation wins, even when Vietnamese is first', async () => {
  const result = await loadNarration(poi, en, () => { throw Error('must not call provider') })
  assert.equal(result.text, 'Real stored narration')
  assert.equal(result.locale, 'en-US')
})
test('missing language requests translation using real API text and source language', async () => {
  const result = await loadNarration(poi, fr, async (text, target, opts) => {
    assert.equal(text, 'Thuyết minh thực tế'); assert.equal(target, 'fr'); assert.equal(opts.sourceLanguage, 'vi')
    return {translatedText: 'Un guide réel', targetLanguage: 'fr', provider: 'google'}
  })
  assert.deepEqual(result, {text: 'Un guide réel', locale: 'fr-FR'})
})
test('provider failure never reads Vietnamese as the requested foreign language', async () => {
  await assert.rejects(loadNarration(poi, fr, async () => { throw Error('503 service not configured') }))
})
test('wrong-language, unchanged-source, and empty provider responses are rejected', async () => {
  for (const response of [
    {translatedText: 'Thuyết minh thực tế', targetLanguage:'vi'},
    {translatedText: 'Thuyết minh thực tế', targetLanguage:'fr'},
    {translatedText: ' ', targetLanguage:'fr'},
  ]) await assert.rejects(loadNarration(poi, fr, async () => response))
})
test('only validated translations are cached; changing real source content invalidates the cache', async () => {
  const cache = new Map(); let count = 0
  const translate = async () => ({translatedText:`Traduction ${++count}`,targetLanguage:'fr'})
  const first = await loadNarration(poi, fr, translate, {cache})
  assert.deepEqual(await loadNarration(poi, fr, translate, {cache}), first)
  await loadNarration({...poi,tr:{vi:'Nội dung đã sửa'}}, fr, translate, {cache})
  assert.equal(count, 2)
})
test('aborted late translation is not returned or cached', async () => {
  const controller = new AbortController(); const cache = new Map()
  await assert.rejects(loadNarration(poi, fr, async () => {
    controller.abort()
    return {translatedText:'Ancien guide',targetLanguage:'fr'}
  },{signal:controller.signal,cache}), {name:'AbortError'})
  assert.equal(cache.size, 0)
})
test('POI ids never pull translations from unrelated static demo places', async () => {
  const historyMuseum = {id:5, tr:{vi:'Bảo tàng Lịch sử Việt Nam'}}
  const result = await loadNarration(historyMuseum, fr, async (text) => {
    assert.equal(text, 'Bảo tàng Lịch sử Việt Nam')
    return {translatedText:'Musée d’histoire du Viêt Nam', targetLanguage:'fr'}
  })
  assert.equal(result.text, 'Musée d’histoire du Viêt Nam')
})
