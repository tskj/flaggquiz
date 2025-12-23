const DEL_COST = 3
const SKIP_COST = 2
const SUB_COST = 3
const STREAK_BIAS = 3
const SWAP_COST = 2  // Cost for transposing adjacent characters

// Pre-process to handle adjacent transpositions (Damerau-Levenshtein style)
function handleTranspositions(query: string, target: string): string {
  const t = target.toLowerCase()

  // Only handle transpositions when lengths match (strings are aligned)
  if (query.length !== t.length) {
    return query
  }

  // If query has adjacent chars that are swapped compared to target, fix them
  const q = query.split('')

  for (let i = 0; i < q.length - 1; i++) {
    // Check if swapping q[i] and q[i+1] would match target better
    if (i < t.length - 1) {
      const current = q[i] + q[i + 1]
      const swapped = q[i + 1] + q[i]
      const targetPair = t[i] + t[i + 1]

      if (swapped === targetPair && current !== targetPair) {
        // Swap them
        ;[q[i], q[i + 1]] = [q[i + 1], q[i]]
      }
    }
  }

  return q.join('')
}

export function fuzzyMatch(query: string, target: string): number {
  const q_original = query.toLowerCase().trim()
  const h = target.toLowerCase().trim()

  if (q_original === h) return 0

  // Try with transposition correction
  const q_fixed = handleTranspositions(q_original, h)
  const q = q_fixed

  // Calculate cost for any transpositions we fixed
  let transpositionPenalty = 0
  for (let i = 0; i < q_original.length; i++) {
    if (q_original[i] !== q_fixed[i]) {
      transpositionPenalty = SWAP_COST
      break
    }
  }

  const q_len = q.length
  const h_len = h.length

  if (q_len === 0) return h_len * SKIP_COST
  if (h_len === 0) return q_len * DEL_COST

  const B = 2
  const bias = Math.min(q_len, h_len) * STREAK_BIAS

  let dp_current = new Array((h_len + 1) * B)
  let dp_previous = new Array((h_len + 1) * B)

  // Base case for q_i = q_len
  for (let h_i = 0; h_i <= h_len; h_i++) {
    const dist = (h_len - h_i) * SKIP_COST + bias
    dp_previous[h_i * B + 0] = dist
    dp_previous[h_i * B + 1] = dist
  }

  for (let q_i = q_len - 1; q_i >= 0; q_i--) {
    const dist = (q_len - q_i) * DEL_COST + bias
    dp_current[h_len * B + 0] = dist
    dp_current[h_len * B + 1] = dist

    for (let h_i = h_len - 1; h_i >= 0; h_i--) {
      const is_match = q.charCodeAt(q_i) === h.charCodeAt(h_i)

      const index_current = h_i * B
      const index_next = (h_i + 1) * B

      const del_cost_total = DEL_COST + dp_previous[index_current + 0]
      const skip_cost_total = SKIP_COST + dp_current[index_next + 0]
      const match_cost = is_match
        ? dp_previous[index_next + 1]
        : SUB_COST + dp_previous[index_next + 0]

      dp_current[index_current + 0] = Math.min(del_cost_total, skip_cost_total, match_cost)

      const del_cost_cm1 = DEL_COST + dp_previous[index_current + 1]
      const skip_cost_cm1 = SKIP_COST + dp_current[index_next + 0]
      const match_cost_cm1 = is_match
        ? dp_previous[index_next + 1] - STREAK_BIAS
        : SUB_COST + dp_previous[index_next + 0]

      dp_current[index_current + 1] = Math.min(del_cost_cm1, skip_cost_cm1, match_cost_cm1)
    }

    ;[dp_current, dp_previous] = [dp_previous, dp_current]
  }

  return dp_previous[0] - (bias > 0 ? STREAK_BIAS : 0) + transpositionPenalty
}

export function isCloseEnough(input: string, answer: string): boolean {
  const normalizedInput = input.toLowerCase().trim()
  const normalizedAnswer = answer.toLowerCase().trim()

  // Exact match always accepted
  if (normalizedInput === normalizedAnswer) {
    return true
  }

  // Minimum 3 chars to avoid weird matches like fi->Fiji, da->Sudan
  if (normalizedInput.length < 3) {
    return false
  }

  const distance = fuzzyMatch(normalizedInput, normalizedAnswer)

  // Base threshold: stricter for short words, more lenient for longer ones
  let maxAllowedDistance = Math.floor(4 + Math.pow(normalizedAnswer.length, 1.3) / 4)

  // More lenient for same-length words (handles typos like Columbia->Colombia)
  const lengthDiff = Math.abs(normalizedInput.length - normalizedAnswer.length)
  if (lengthDiff <= 1 && normalizedAnswer.length >= 6) {
    maxAllowedDistance = Math.floor(4 + Math.pow(normalizedAnswer.length, 1.3) / 2.5)
  }

  return distance <= maxAllowedDistance
}

/**
 * Stricter matching for tracking wrong attempts.
 * Only returns true if the input is very close to the answer,
 * requiring similar length and low edit distance.
 * This prevents "Tsjekkia" from matching "Tsjad" or "Indonesia" from matching "India".
 */
export function isStrictMatch(input: string, answer: string): boolean {
  const normalizedInput = input.toLowerCase().trim()
  const normalizedAnswer = answer.toLowerCase().trim()

  // Exact match
  if (normalizedInput === normalizedAnswer) {
    return true
  }

  // Minimum 3 chars
  if (normalizedInput.length < 3) {
    return false
  }

  // Length must be within 2 characters of each other
  const lengthDiff = Math.abs(normalizedInput.length - normalizedAnswer.length)
  if (lengthDiff > 2) {
    return false
  }

  // Use a much stricter distance threshold
  const distance = fuzzyMatch(normalizedInput, normalizedAnswer)
  // Only allow very small differences (basically typos)
  const maxAllowedDistance = Math.min(4, Math.floor(normalizedAnswer.length / 3))
  return distance <= maxAllowedDistance
}

// Check if input is ambiguous - matches multiple possible answers
export function isAmbiguous(input: string, correctAnswer: string, allAnswers: string[]): boolean {
  const normalizedInput = input.toLowerCase().trim()
  const normalizedAnswer = correctAnswer.toLowerCase().trim()

  // Exact match is never ambiguous
  if (normalizedInput === normalizedAnswer) {
    return false
  }

  if (!isCloseEnough(input, correctAnswer)) {
    return false // Not even matching the correct answer
  }

  // Check if input also matches other answers
  for (const answer of allAnswers) {
    if (answer.toLowerCase().trim() === normalizedAnswer) continue
    if (isCloseEnough(input, answer)) {
      return true // Ambiguous - matches another country too
    }
  }
  return false
}

export type MatchResult =
  | ['no_match']
  | ['ambiguous', string[]]
  | ['match', string]

/**
 * Check if user input matches the correct answer for a country.
 *
 * @param input - The user's typed input
 * @param correctAnswer - The correct Norwegian country name
 * @param allAnswers - All Norwegian country names (for ambiguity detection)
 * @param alternativeNames - Optional alternative accepted names for this country
 * @param allAlternativeNames - Optional map of all countries' alternative names (for ambiguity detection)
 * @returns ['match', name] if correct, ['ambiguous', countries[]] if multiple match, ['no_match'] otherwise
 */
export function checkAnswer(
  input: string,
  correctAnswer: string,
  allAnswers: string[],
  alternativeNames: string[] = [],
  allAlternativeNames: Record<string, string[]> = {}
): MatchResult {
  const normalizedInput = input.toLowerCase().trim()
  const normalizedCorrect = correctAnswer.toLowerCase().trim()

  // Exact match with main name - always accepted
  if (normalizedInput === normalizedCorrect) {
    return ['match', correctAnswer]
  }

  // Exact match with alternative name - always accepted
  for (const alt of alternativeNames) {
    if (normalizedInput === alt.toLowerCase().trim()) {
      return ['match', alt]
    }
  }

  // Check fuzzy match with main answer or any alternative
  let matchedName: string | null = null
  if (isCloseEnough(input, correctAnswer)) {
    matchedName = correctAnswer
  } else {
    for (const alt of alternativeNames) {
      if (isCloseEnough(input, alt)) {
        matchedName = alt
        break
      }
    }
  }

  if (!matchedName) {
    return ['no_match']
  }

  // Input fuzzy-matches - check for ambiguity with other countries
  const ambiguousMatches: string[] = [correctAnswer]

  // Check main names
  for (const answer of allAnswers) {
    if (answer.toLowerCase().trim() === normalizedCorrect) {
      continue
    }
    if (isCloseEnough(input, answer)) {
      ambiguousMatches.push(answer)
    }
  }

  // Check alternative names of other countries
  for (const [mainName, altNames] of Object.entries(allAlternativeNames)) {
    if (mainName.toLowerCase().trim() === normalizedCorrect) {
      continue // Skip the correct country's alternatives
    }
    for (const alt of altNames) {
      if (isCloseEnough(input, alt)) {
        // Add the main name (not the alt) to show which country it conflicts with
        if (!ambiguousMatches.includes(mainName)) {
          ambiguousMatches.push(mainName)
        }
        break
      }
    }
  }

  if (ambiguousMatches.length > 1) {
    return ['ambiguous', ambiguousMatches]
  }

  return ['match', matchedName]
}
