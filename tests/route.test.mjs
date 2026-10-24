import { test } from 'node:test'
import assert from 'node:assert/strict'
import { GOOGLE_TRAVEL_MODES, buildGoogleRouteRequest, summarizeGoogleRoute } from '../src/services/googleRouting.js'
const start = { lat: 10.7766, lng: 106.7032 }
const end = { lat: 10.7725, lng: 106.698 }

test('Google Maps transport modes distinguish a real motorcycle route from cars and walking', () => {
  assert.equal(GOOGLE_TRAVEL_MODES.motorcycle, 'TWO_WHEELER')
  assert.equal(buildGoogleRouteRequest(start, end, 'motorcycle').travelMode, 'TWO_WHEELER')
  assert.equal(buildGoogleRouteRequest(start, end, 'walking').travelMode, 'WALKING')
  assert.equal(buildGoogleRouteRequest(start, end, 'driving').travelMode, 'DRIVING')
  assert.equal(buildGoogleRouteRequest(start, end, 'motorcycle').routeModifiers.avoidHighways, true)
})
test('Google Routes request contains origin, destination and selected fields', () => {
  const request = buildGoogleRouteRequest(start, end, 'driving')
  assert.deepEqual(request.origin, start)
  assert.deepEqual(request.destination, end)
  assert.ok(request.fields.includes('path'))
  assert.ok(request.fields.includes('distanceMeters'))
  assert.ok(request.fields.includes('legs.steps.instructions'))
  assert.throws(() => buildGoogleRouteRequest(null, end, 'driving'))
})
test('Google route response converts to the UI distance/ETA/turn steps', () => {
  const summary = summarizeGoogleRoute({ distanceMeters: 2200, durationMillis: 360000, legs: [{steps:[{instructions:'Turn left'}]}] }, 'motorcycle')
  assert.equal(summary.distanceMeters,2200)
  assert.equal(summary.durationSeconds,360)
  assert.equal(summary.steps[0].instruction,'Turn left')
  assert.equal(summary.mode,'motorcycle')
})
