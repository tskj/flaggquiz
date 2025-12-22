const DEL_COST = 3
const SKIP_COST = 2
const SUB_COST = 3
const STREAK_BIAS = 3

export function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim()
  const h = target.toLowerCase().trim()

  if (q === h) return 0

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

  return dp_previous[0] - (bias > 0 ? STREAK_BIAS : 0)
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
  // Stricter for short words, more lenient for longer ones
  const maxAllowedDistance = Math.floor(4 + Math.pow(normalizedAnswer.length, 1.3) / 4)
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
