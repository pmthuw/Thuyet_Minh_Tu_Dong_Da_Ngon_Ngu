import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { googleDirectionsUrl, googleMapEmbedUrl } from '../src/services/googleMaps.js'
import { POIS, LANGS, UI } from '../src/data.js'

const destination = { lat: 10.777, lng: 106.6954 }
const origin = { lat: 10.7745, lng: 106.704 }

test('walking, motorcycle, driving always reach distinct Google Maps routes', () => {
  const modes = { walking: 'walking', motorcycle: 'two-wheeler', driving: 'driving' }
  for (const [mode, travelmode] of Object.entries(modes)) {
    const url = new URL(googleDirectionsUrl(destination, { origin, mode, language: 'vi' }))
    assert.equal(url.origin, 'https://www.google.com')
    assert.equal(url.pathname, '/maps/dir/')
    assert.equal(url.searchParams.get('travelmode'), travelmode)
    assert.equal(url.searchParams.get('origin'), `${origin.lat},${origin.lng}`)
    assert.equal(url.searchParams.get('destination'), `${destination.lat},${destination.lng}`)
  }
  assert.equal(googleDirectionsUrl(destination, { mode: 'bicycling' }), null)
})

test('not granted GPS: never use a fake origin for directions', () => {
  const url = new URL(googleDirectionsUrl(destination))
  assert.equal(url.searchParams.has('origin'), false)
})

test('one Google Maps iframe in UI and three controls for routes', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.equal((app.match(/<GoogleMap /g) || []).length, 1)
  assert.equal((app.match(/<MapMock /g) || []).length, 0)
  for (const mode of ['walking', 'motorcycle', 'driving']) {
    assert.match(app, new RegExp(`travelMode === '${mode}'`))
  }
  assert.match(googleMapEmbedUrl(destination), /^https:\/\/maps\.google\.com\/maps\?/)
})

test('all 6 POIs have a narration for all 6 languages', () => {
  assert.equal(POIS.length, 6)
  assert.equal(LANGS.length, 6)
  for (const place of POIS) for (const lang of LANGS) {
    assert.ok(place.tr[lang.code], `${place.name} missing ${lang.code}`)
    assert.ok(UI[lang.code]?.motorcycle, `${lang.code} missing motorcycle label`)
  }
})
