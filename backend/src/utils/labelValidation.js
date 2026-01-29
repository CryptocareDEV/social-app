export const isValidLabel = (label) => {
  if (!label) return false

  // normalize
  const key = label.toLowerCase().trim()

  // length check
  if (key.length < 3 || key.length > 24) return false

  // allowed characters: a-z, numbers, hyphen
  if (!/^[a-z0-9-]+$/.test(key)) return false

  // must contain at least one letter
  if (!/[a-z]/.test(key)) return false

  // reject obvious garbage patterns
  const garbagePatterns = [
    /^([a-z])\1{2,}$/,      // aaa, bbbb
    /^(asdf|qwer|zxcv)/,    // keyboard mashing
  ]

  if (garbagePatterns.some((r) => r.test(key))) {
    return false
  }

  return true
}
