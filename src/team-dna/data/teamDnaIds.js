/**
 * Stable Team DNA IDs.
 *
 * What: creates IDs for combined member states such as duo insights.
 * How: sorts member IDs before joining so pair lookup is order-insensitive.
 * Port: preserve this behavior even if backend pair IDs arrive later; Rahul x
 * Sergio and Sergio x Rahul should resolve to the same duo insight.
 */
export function makePairId(firstId, secondId) {
  return [firstId, secondId].sort().join('__');
}
