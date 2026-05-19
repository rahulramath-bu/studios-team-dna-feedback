// Monolith integration tip: pair insights should be order-insensitive so the
// same duo resolves regardless of which teammate the user selects first.
export function makePairId(firstId, secondId) {
  return [firstId, secondId].sort().join('__');
}
