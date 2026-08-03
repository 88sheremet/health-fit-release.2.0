function hSlot(slot, otherwise) {
  return slot !== void 0 ? slot() || otherwise : otherwise
}

/**
 * Source definitely exists,
 * so it's merged with the possible slot
 */
function hMergeSlot(slot, source) {
  // oxlint-disable-next-line unicorn/prefer-spread
  return slot !== void 0 ? source.concat(slot()) : source
}

/**
 * Merge with possible slot,
 * even if source might not exist
 */
function hMergeSlotSafely(slot, source) {
  if (slot === void 0) return source

  // oxlint-disable-next-line unicorn/prefer-spread
  return source !== void 0 ? source.concat(slot()) : slot()
}

export { hSlot as a, hMergeSlot as b, hMergeSlotSafely as h };
//# sourceMappingURL=render.mjs.map
