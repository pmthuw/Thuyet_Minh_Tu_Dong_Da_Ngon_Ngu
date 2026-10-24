// Google Maps JavaScript Routes Library (API v=beta).
// TWO_WHEELER is a real powered-motorcycle mode, NOT a driving/bicycling fallback.
export const GOOGLE_TRAVEL_MODES = Object.freeze({
  walking: 'WALKING',
  motorcycle: 'TWO_WHEELER',
  driving: 'DRIVING',
})

export function buildGoogleRouteRequest(origin, destination, mode) {
  if (!origin || !destination || ![origin.lat, origin.lng, destination.lat, destination.lng].every(Number.isFinite)) {
    throw new Error('Điểm xuất phát hoặc điểm đến không hợp lệ.')
  }
  const travelMode = GOOGLE_TRAVEL_MODES[mode]
  if (!travelMode) throw new Error('Loại phương tiện không hợp lệ.')
  return {
    origin: { lat: origin.lat, lng: origin.lng },
    destination: { lat: destination.lat, lng: destination.lng },
    travelMode,
    fields: ['path', 'distanceMeters', 'durationMillis', 'legs.steps.instructions'],
    ...(mode === 'motorcycle' ? { routeModifiers: { avoidHighways: true } } : {}),
  }
}

export function summarizeGoogleRoute(result, mode) {
  return {
    mode,
    distanceMeters: result.distanceMeters ?? 0,
    durationSeconds: Math.ceil((result.durationMillis ?? 0) / 1000),
    steps: (result.legs || []).flatMap(leg => (leg.steps || []).map(step => ({
      instruction: step.instructions || '',
    })).filter(step => step.instruction)),
  }
}
