import { z } from 'zod'

// Quiz types
export type QuizType = 'world' | 'europe' | 'africa' | 'asia' | 'north-america' | 'south-america' | 'oceania' | 'territories'

// Schema for a single quiz session
export const QuizSessionSchema = z.object({
  id: z.string(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  timerEnabled: z.boolean(),
  timeRemaining: z.number(),
  quizType: z.enum(['world', 'europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'territories']).default('world'),

  // Quiz configuration
  quizOrder: z.array(z.string()),

  // Progress
  currentQueue: z.array(z.string()),
  currentIndex: z.number(),
  skippedFlags: z.array(z.string()),
  round: z.number(),

  // Results
  correctFlags: z.array(z.string()),
  struggledFlags: z.record(z.string(), z.array(z.string())),

  // Mid-question state
  currentAttempts: z.array(z.string()),
  pendingWrongMatch: z.string().nullable(),
  input: z.string(),
})

export type QuizSession = z.infer<typeof QuizSessionSchema>

// Schema for history
export const QuizHistorySchema = z.object({
  sessions: z.array(QuizSessionSchema),
})

export type QuizHistory = z.infer<typeof QuizHistorySchema>

const ACTIVE_KEY = 'flaggquiz_active'
const HISTORY_KEY = 'flaggquiz_history'

export function loadActiveSession(): QuizSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return QuizSessionSchema.parse(parsed)
  } catch (e) {
    console.warn('Failed to load active session:', e)
    localStorage.removeItem(ACTIVE_KEY)
    return null
  }
}

export function saveActiveSession(session: QuizSession): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(session))
}

export function clearActiveSession(): void {
  localStorage.removeItem(ACTIVE_KEY)
}

export function loadHistory(): QuizHistory {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return { sessions: [] }
    const parsed = JSON.parse(raw)
    return QuizHistorySchema.parse(parsed)
  } catch (e) {
    console.warn('Failed to load history:', e)
    return { sessions: [] }
  }
}

export function saveHistory(history: QuizHistory): void {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function addToHistory(session: QuizSession): void {
  const history = loadHistory()
  history.sessions.push(session)
  // Keep last 100 sessions to avoid unbounded growth
  if (history.sessions.length > 100) {
    history.sessions = history.sessions.slice(-100)
  }
  saveHistory(history)
}

export type HighScore = {
  correct: number
  total: number
  percentage: number
}

export function getHighScores(): Record<QuizType, HighScore | null> {
  const history = loadHistory()
  const highScores: Record<QuizType, HighScore | null> = {
    'world': null,
    'europe': null,
    'africa': null,
    'asia': null,
    'north-america': null,
    'south-america': null,
    'oceania': null,
    'territories': null,
  }

  for (const session of history.sessions) {
    if (!session.finishedAt) continue // Only count finished sessions

    const quizType = session.quizType || 'world'
    const correct = session.correctFlags.length
    const total = session.quizOrder.length
    const percentage = total > 0 ? (correct / total) * 100 : 0

    const current = highScores[quizType]
    if (!current || percentage > current.percentage ||
        (percentage === current.percentage && correct > current.correct)) {
      highScores[quizType] = { correct, total, percentage }
    }
  }

  return highScores
}
