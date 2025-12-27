import { z } from 'zod'

// Quiz types - flag quizzes, map quizzes, kids quizzes, and capital quizzes
export type QuizType =
  | 'world' | 'europe' | 'africa' | 'asia' | 'north-america' | 'south-america' | 'oceania' | 'territories'
  | 'map-world' | 'map-europe' | 'map-africa' | 'map-asia' | 'map-north-america' | 'map-south-america' | 'map-oceania' | 'map-territories'
  | 'kids-europe' | 'kids-map-europe' | 'kids-world' | 'kids-map-world'
  | 'capital-input-europe' | 'capital-choice-europe'

export const isMapQuiz = (type: QuizType): boolean => type.startsWith('map-') || type === 'kids-map-europe' || type === 'kids-map-world'
export const isKidsQuiz = (type: QuizType): boolean => type.startsWith('kids-')
export const isKidsFlagQuiz = (type: QuizType): boolean => type === 'kids-europe' || type === 'kids-world'
export const isKidsMapQuiz = (type: QuizType): boolean => type === 'kids-map-europe' || type === 'kids-map-world'
export const isCapitalQuiz = (type: QuizType): boolean => type.startsWith('capital-')
export const isCapitalInputQuiz = (type: QuizType): boolean => type === 'capital-input-europe'
export const isCapitalChoiceQuiz = (type: QuizType): boolean => type === 'capital-choice-europe'
export const getBaseQuizType = (type: QuizType): QuizType =>
  type.startsWith('map-') ? type.replace('map-', '') as QuizType :
  type === 'kids-map-europe' ? 'europe' as QuizType :
  type === 'kids-map-world' ? 'world' as QuizType :
  type.startsWith('kids-') ? type.replace('kids-', '') as QuizType :
  type.startsWith('capital-') ? 'europe' as QuizType : type

// Schema for a single quiz session
export const QuizSessionSchema = z.object({
  id: z.string(),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  timerEnabled: z.boolean(),
  timeRemaining: z.number(),
  quizType: z.enum([
    'world', 'europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'territories',
    'map-world', 'map-europe', 'map-africa', 'map-asia', 'map-north-america', 'map-south-america', 'map-oceania', 'map-territories',
    'kids-europe', 'kids-map-europe', 'kids-world', 'kids-map-world',
    'capital-input-europe', 'capital-choice-europe'
  ]).default('world'),

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

  // Kids mode
  kidsMode: z.boolean().optional().default(false),
  currentOptions: z.array(z.string()).optional().default([]),

  // Capital choice quiz - what type of representation each option shows
  // 'name' = country name, 'flag' = country flag, 'map' = country map
  capitalChoiceTypes: z.array(z.enum(['name', 'flag', 'map'])).optional().default([]),
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
    'map-world': null,
    'map-europe': null,
    'map-africa': null,
    'map-asia': null,
    'map-north-america': null,
    'map-south-america': null,
    'map-oceania': null,
    'map-territories': null,
    'kids-europe': null,
    'kids-map-europe': null,
    'kids-world': null,
    'kids-map-world': null,
    'capital-input-europe': null,
    'capital-choice-europe': null,
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
