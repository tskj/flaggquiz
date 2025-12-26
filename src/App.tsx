import { useState, useEffect, useRef, useCallback } from 'react'
import countryFlags from '../country-flags.json'
import territoryFlags from '../disputed-territories.json'
import { checkAnswer as matchAnswer, isStrictMatch } from './fuzzyMatch'
import { loadActiveSession, saveActiveSession, clearActiveSession, addToHistory, type QuizSession, type QuizType } from './storage'

// European countries (English names matching country-flags.json keys)
export const europeanCountries = [
  'Albania', 'Andorra', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
  'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland',
  'Italy', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Malta', 'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia',
  'Norway', 'Poland', 'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia',
  'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'Ukraine',
  'United Kingdom', 'Vatican City'
]

// Norwegian names for disputed territories
export const territoryNorwegianNames: Record<string, string> = {
  "Abkhazia": "Abkhasia",
  "Cook Islands": "Cookøyene",
  "England": "England",
  "Niue": "Niue",
  "Northern Cyprus": "Nord-Kypros",
  "Northern Ireland": "Nord-Irland",
  "Palestine": "Palestina",
  "Sahrawi Arab Democratic Republic": "Vest-Sahara",
  "Scotland": "Skottland",
  "Somaliland": "Somaliland",
  "South Ossetia": "Sør-Ossetia",
  "Transnistria": "Transnistria",
  "Wales": "Wales",
}

// Alternative names that should also be accepted
export const alternativeNames: Record<string, string[]> = {
  "United Kingdom": ["UK"],
  "United States": ["Amerika", "De forente amerikanske stater"],
  "Myanmar": ["Burma"],
  "Belarus": ["Belarus"],
  "Sri Lanka": ["Ceylon"],
}

export const norwegianNames: Record<string, string> = {
  "Afghanistan": "Afghanistan",
  "Albania": "Albania",
  "Algeria": "Algerie",
  "Andorra": "Andorra",
  "Angola": "Angola",
  "Antigua and Barbuda": "Antigua og Barbuda",
  "Argentina": "Argentina",
  "Armenia": "Armenia",
  "Australia": "Australia",
  "Austria": "Østerrike",
  "Azerbaijan": "Aserbajdsjan",
  "Bahamas": "Bahamas",
  "Bahrain": "Bahrain",
  "Bangladesh": "Bangladesh",
  "Barbados": "Barbados",
  "Belarus": "Hviterussland",
  "Belgium": "Belgia",
  "Belize": "Belize",
  "Benin": "Benin",
  "Bhutan": "Bhutan",
  "Bolivia": "Bolivia",
  "Bosnia and Herzegovina": "Bosnia-Hercegovina",
  "Botswana": "Botswana",
  "Brazil": "Brasil",
  "Brunei": "Brunei",
  "Bulgaria": "Bulgaria",
  "Burkina Faso": "Burkina Faso",
  "Burundi": "Burundi",
  "Cambodia": "Kambodsja",
  "Cameroon": "Kamerun",
  "Canada": "Canada",
  "Cape Verde": "Kapp Verde",
  "Central African Republic": "Den sentralafrikanske republikk",
  "Chad": "Tsjad",
  "Chile": "Chile",
  "China": "Kina",
  "Colombia": "Colombia",
  "Comoros": "Komorene",
  "Democratic Republic of the Congo": "Den demokratiske republikken Kongo",
  "Republic of the Congo": "Republikken Kongo",
  "Costa Rica": "Costa Rica",
  "Croatia": "Kroatia",
  "Cuba": "Cuba",
  "Cyprus": "Kypros",
  "Czech Republic": "Tsjekkia",
  "Denmark": "Danmark",
  "Djibouti": "Djibouti",
  "Dominica": "Dominica",
  "Dominican Republic": "Den dominikanske republikk",
  "Ecuador": "Ecuador",
  "Egypt": "Egypt",
  "El Salvador": "El Salvador",
  "Equatorial Guinea": "Ekvatorial-Guinea",
  "Eritrea": "Eritrea",
  "Estonia": "Estland",
  "Eswatini": "Eswatini",
  "Ethiopia": "Etiopia",
  "Fiji": "Fiji",
  "Finland": "Finland",
  "France": "Frankrike",
  "Gabon": "Gabon",
  "Gambia": "Gambia",
  "Georgia": "Georgia",
  "Germany": "Tyskland",
  "Ghana": "Ghana",
  "Greece": "Hellas",
  "Grenada": "Grenada",
  "Guatemala": "Guatemala",
  "Guinea": "Guinea",
  "Guinea-Bissau": "Guinea-Bissau",
  "Guyana": "Guyana",
  "Haiti": "Haiti",
  "Honduras": "Honduras",
  "Hungary": "Ungarn",
  "Iceland": "Island",
  "India": "India",
  "Indonesia": "Indonesia",
  "Iran": "Iran",
  "Iraq": "Irak",
  "Ireland": "Irland",
  "Israel": "Israel",
  "Italy": "Italia",
  "Ivory Coast": "Elfenbenskysten",
  "Jamaica": "Jamaica",
  "Japan": "Japan",
  "Jordan": "Jordan",
  "Kazakhstan": "Kasakhstan",
  "Kenya": "Kenya",
  "Kiribati": "Kiribati",
  "Kuwait": "Kuwait",
  "Kyrgyzstan": "Kirgisistan",
  "Laos": "Laos",
  "Latvia": "Latvia",
  "Lebanon": "Libanon",
  "Lesotho": "Lesotho",
  "Liberia": "Liberia",
  "Libya": "Libya",
  "Liechtenstein": "Liechtenstein",
  "Lithuania": "Litauen",
  "Luxembourg": "Luxembourg",
  "Madagascar": "Madagaskar",
  "Malawi": "Malawi",
  "Malaysia": "Malaysia",
  "Maldives": "Maldivene",
  "Mali": "Mali",
  "Malta": "Malta",
  "Marshall Islands": "Marshalløyene",
  "Mauritania": "Mauritania",
  "Mauritius": "Mauritius",
  "Mexico": "Mexico",
  "Micronesia": "Mikronesia",
  "Moldova": "Moldova",
  "Monaco": "Monaco",
  "Mongolia": "Mongolia",
  "Montenegro": "Montenegro",
  "Morocco": "Marokko",
  "Mozambique": "Mosambik",
  "Myanmar": "Myanmar",
  "Namibia": "Namibia",
  "Nauru": "Nauru",
  "Nepal": "Nepal",
  "Netherlands": "Nederland",
  "New Zealand": "New Zealand",
  "Nicaragua": "Nicaragua",
  "Niger": "Niger",
  "Nigeria": "Nigeria",
  "North Korea": "Nord-Korea",
  "North Macedonia": "Nord-Makedonia",
  "Norway": "Norge",
  "Oman": "Oman",
  "Pakistan": "Pakistan",
  "Palau": "Palau",
  "Panama": "Panama",
  "Papua New Guinea": "Papua Ny-Guinea",
  "Paraguay": "Paraguay",
  "Peru": "Peru",
  "Philippines": "Filippinene",
  "Poland": "Polen",
  "Portugal": "Portugal",
  "Qatar": "Qatar",
  "Romania": "Romania",
  "Russia": "Russland",
  "Rwanda": "Rwanda",
  "Saint Kitts and Nevis": "Saint Kitts og Nevis",
  "Saint Lucia": "Saint Lucia",
  "Saint Vincent and the Grenadines": "Saint Vincent og Grenadinene",
  "Samoa": "Samoa",
  "San Marino": "San Marino",
  "Sao Tome and Principe": "São Tomé og Príncipe",
  "Saudi Arabia": "Saudi-Arabia",
  "Senegal": "Senegal",
  "Serbia": "Serbia",
  "Seychelles": "Seychellene",
  "Sierra Leone": "Sierra Leone",
  "Singapore": "Singapore",
  "Slovakia": "Slovakia",
  "Slovenia": "Slovenia",
  "Solomon Islands": "Salomonøyene",
  "Somalia": "Somalia",
  "South Africa": "Sør-Afrika",
  "South Korea": "Sør-Korea",
  "South Sudan": "Sør-Sudan",
  "Spain": "Spania",
  "Sri Lanka": "Sri Lanka",
  "Sudan": "Sudan",
  "Suriname": "Surinam",
  "Sweden": "Sverige",
  "Switzerland": "Sveits",
  "Syria": "Syria",
  "Tajikistan": "Tadsjikistan",
  "Tanzania": "Tanzania",
  "Thailand": "Thailand",
  "Timor-Leste": "Øst-Timor",
  "Togo": "Togo",
  "Tonga": "Tonga",
  "Trinidad and Tobago": "Trinidad og Tobago",
  "Tunisia": "Tunisia",
  "Turkey": "Tyrkia",
  "Turkmenistan": "Turkmenistan",
  "Tuvalu": "Tuvalu",
  "Uganda": "Uganda",
  "Ukraine": "Ukraina",
  "United Arab Emirates": "De forente arabiske emirater",
  "United Kingdom": "Storbritannia",
  "United States": "USA",
  "Uruguay": "Uruguay",
  "Uzbekistan": "Usbekistan",
  "Vanuatu": "Vanuatu",
  "Vatican City": "Vatikanstaten",
  "Venezuela": "Venezuela",
  "Vietnam": "Vietnam",
  "Yemen": "Jemen",
  "Zambia": "Zambia",
  "Zimbabwe": "Zimbabwe",
  // Delvis anerkjente stater
  "Kosovo": "Kosovo",
  "Taiwan": "Taiwan",
}

// Map Norwegian names to their alternatives (for ambiguity checking)
const norwegianAlternativeNames: Record<string, string[]> = Object.fromEntries(
  Object.entries(alternativeNames).map(([englishName, alts]) => [
    norwegianNames[englishName] || englishName,
    alts
  ])
)

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQueue, setCurrentQueue] = useState<string[]>([])
  const [skippedFlags, setSkippedFlags] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(15 * 60)
  const [timerEnabled, setTimerEnabled] = useState(true)
  const [completedCount, setCompletedCount] = useState(0)
  const [round, setRound] = useState(1)
  const [justAnswered, setJustAnswered] = useState(false)
  const [quizOrder, setQuizOrder] = useState<string[]>([])
  const [correctFlags, setCorrectFlags] = useState<Set<string>>(new Set())
  const [showAllResults, setShowAllResults] = useState(false)
  const [struggledFlags, setStruggledFlags] = useState<Map<string, string[]>>(new Map())
  const [currentAttempts, setCurrentAttempts] = useState<string[]>([])
  const [pendingWrongMatch, setPendingWrongMatch] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuizType>('world')
  const inputRef = useRef<HTMLInputElement>(null)

  // Get the appropriate flags and names based on quiz type
  const getQuizFlags = (type: QuizType) => type === 'territories' ? territoryFlags : countryFlags
  const getQuizName = (country: string) => {
    if (quizType === 'territories') {
      return territoryNorwegianNames[country] || country
    }
    return norwegianNames[country] || country
  }

  const currentFlags = getQuizFlags(quizType)
  const totalFlags = quizType === 'europe'
    ? europeanCountries.length
    : quizType === 'territories'
      ? Object.keys(territoryFlags).length
      : Object.keys(countryFlags).length
  const allNorwegianNames = quizType === 'territories'
    ? Object.keys(territoryFlags).map(c => territoryNorwegianNames[c] || c)
    : Object.keys(countryFlags).map(c => norwegianNames[c] || c)

  // Track if session was already finished when loaded (to avoid duplicate history)
  const wasFinishedOnLoad = useRef(false)
  const hasMovedToHistory = useRef(false)

  // Build current session object for saving
  const buildSession = useCallback((): QuizSession | null => {
    if (!sessionId) return null
    return {
      id: sessionId,
      startedAt: parseInt(sessionId),
      finishedAt: quizFinished ? Date.now() : undefined,
      timerEnabled,
      timeRemaining,
      quizType,
      quizOrder,
      currentQueue,
      currentIndex,
      skippedFlags,
      round,
      correctFlags: Array.from(correctFlags),
      struggledFlags: Object.fromEntries(struggledFlags),
      currentAttempts,
      pendingWrongMatch,
      input,
    }
  }, [sessionId, quizFinished, timerEnabled, timeRemaining, quizType, quizOrder, currentQueue, currentIndex, skippedFlags, round, correctFlags, struggledFlags, currentAttempts, pendingWrongMatch, input])

  // Load session on mount
  useEffect(() => {
    const saved = loadActiveSession()
    if (saved) {
      setSessionId(saved.id)
      setQuizStarted(true)
      setQuizFinished(!!saved.finishedAt)
      setTimerEnabled(saved.timerEnabled)
      setTimeRemaining(saved.timeRemaining)
      setQuizType(saved.quizType || 'world')
      setQuizOrder(saved.quizOrder)
      setCurrentQueue(saved.currentQueue)
      setCurrentIndex(saved.currentIndex)
      setSkippedFlags(saved.skippedFlags)
      setRound(saved.round)
      setCorrectFlags(new Set(saved.correctFlags))
      setCompletedCount(saved.correctFlags.length)
      setStruggledFlags(new Map(Object.entries(saved.struggledFlags)))
      setCurrentAttempts(saved.currentAttempts)
      setPendingWrongMatch(saved.pendingWrongMatch)
      setInput(saved.input)
      // Mark if already finished to avoid duplicate history entries on refresh
      if (saved.finishedAt) {
        wasFinishedOnLoad.current = true
      }
    }
    setIsLoading(false)
  }, [])

  // Save session on state changes
  useEffect(() => {
    if (isLoading || !sessionId) return
    const session = buildSession()
    if (session) {
      saveActiveSession(session)
    }
  }, [isLoading, sessionId, buildSession])

  // Move to history when quiz finishes (but keep active session for refresh)
  useEffect(() => {
    // Skip if already finished when loaded (already in history)
    if (wasFinishedOnLoad.current) return

    if (quizFinished && sessionId && !hasMovedToHistory.current) {
      hasMovedToHistory.current = true
      const session = buildSession()
      if (session) {
        session.finishedAt = Date.now()
        addToHistory(session)
        // Don't clear active session - keep it for refresh on results screen
        saveActiveSession(session)
      }
    }
    if (!quizFinished) {
      hasMovedToHistory.current = false
    }
  }, [quizFinished, sessionId, buildSession])

  useEffect(() => {
    if (!quizStarted || quizFinished || !timerEnabled) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setQuizFinished(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [quizStarted, quizFinished, timerEnabled])

  useEffect(() => {
    if (quizStarted && !quizFinished && inputRef.current) {
      // preventScroll to avoid mobile keyboard pushing content out of view
      inputRef.current.focus({ preventScroll: true })
    }
  }, [quizStarted, quizFinished, currentIndex, round])


  const startQuiz = (type: QuizType = 'world') => {
    clearActiveSession()
    const flags = getQuizFlags(type)
    const allCountries = type === 'europe'
      ? europeanCountries.filter(c => c in countryFlags)
      : Object.keys(flags)
    const shuffled = shuffleArray(allCountries)
    const newSessionId = Date.now().toString()
    // Territories: 3 minutes, Europe: 10 minutes, World: 15 minutes
    const defaultTime = type === 'territories' ? 3 * 60 : type === 'europe' ? 10 * 60 : 15 * 60
    setSessionId(newSessionId)
    setQuizType(type)
    setCurrentQueue(shuffled)
    setQuizOrder(shuffled)
    setSkippedFlags([])
    setCurrentIndex(0)
    setCompletedCount(0)
    setTimeRemaining(defaultTime)
    setRound(1)
    setQuizStarted(true)
    setQuizFinished(false)
    setCorrectFlags(new Set())
    setShowAllResults(false)
    setStruggledFlags(new Map())
    setCurrentAttempts([])
    setInput('')
  }

  const currentCountry = currentQueue[currentIndex]
  const correctAnswer = getQuizName(currentCountry)
  const altNames = alternativeNames[currentCountry] || []

  // Check if value matches the correct answer or any alternative name
  const matchesCorrectAnswer = (value: string): boolean => {
    const result = matchAnswer(value, correctAnswer, allNorwegianNames, altNames, norwegianAlternativeNames)
    return result[0] === 'match'
  }

  const checkAnswer = (value: string, prevValue: string) => {
    if (justAnswered) return
    if (matchesCorrectAnswer(value)) {
      setJustAnswered(true)
      setCompletedCount(prev => prev + 1)
      setCorrectFlags(prev => new Set(prev).add(currentCountry))
      // If we had attempts before getting it right, mark as struggled
      if (currentAttempts.length > 0) {
        setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts]))
      }
      setCurrentAttempts([])
      setPendingWrongMatch(null)
      setTimeout(() => {
        setJustAnswered(false)
        moveToNext(false)
      }, 400)
    } else {
      // Check if input is a strict match for any other country (for tracking wrong attempts)
      // Uses strict matching to avoid false positives like "Tsjekkia" matching "Tsjad"
      let currentMatch: string | null = null
      if (value.trim().length >= 3) {
        for (const country of Object.keys(currentFlags)) {
          if (country === currentCountry) continue
          const countryName = getQuizName(country)
          // Use strict matching: requires similar length and very low edit distance
          if (isStrictMatch(value, countryName)) {
            currentMatch = country
            break
          }
          // Also check alternative names
          const countryAltNames = alternativeNames[country] || []
          for (const alt of countryAltNames) {
            if (isStrictMatch(value, alt)) {
              currentMatch = country
              break
            }
          }
          if (currentMatch) break
        }
      }

      // Only track as attempt when user deletes/backspaces away from a match
      // This avoids false positives from typing through a partial match
      const isDeleting = value.length < prevValue.length

      if (pendingWrongMatch && isDeleting && currentMatch !== pendingWrongMatch && !currentAttempts.includes(pendingWrongMatch)) {
        setCurrentAttempts(prev => [...prev, pendingWrongMatch!])
      }

      setPendingWrongMatch(currentMatch)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (justAnswered) return
    const value = e.target.value
    const prevValue = input
    setInput(value)
    checkAnswer(value, prevValue)
  }

  const skipFlag = () => {
    moveToNext(true)
  }

  const giveUp = () => {
    setQuizFinished(true)
  }

  const goToStartScreen = () => {
    clearActiveSession()
    setQuizStarted(false)
    setQuizFinished(false)
    setSessionId(null)
  }

  const moveToNext = (wasSkipped: boolean) => {
    const newSkipped = wasSkipped
      ? [...skippedFlags, currentCountry]
      : skippedFlags

    // Save any attempts made on this flag (even if skipping)
    if (currentAttempts.length > 0) {
      setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts]))
    }

    if (currentIndex + 1 < currentQueue.length) {
      setCurrentIndex(currentIndex + 1)
      if (wasSkipped) setSkippedFlags(newSkipped)
    } else if (newSkipped.length > 0) {
      // Keep original order from quizOrder for subsequent rounds
      const orderedSkipped = newSkipped.sort((a, b) => quizOrder.indexOf(a) - quizOrder.indexOf(b))
      setCurrentQueue(orderedSkipped)
      setSkippedFlags([])
      setCurrentIndex(0)
      setRound(prev => prev + 1)
    } else {
      setQuizFinished(true)
    }
    setInput('')
    setCurrentAttempts([])
    setPendingWrongMatch(null)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      // Remove current flag from skipped if it was just skipped
      const prevFlag = currentQueue[currentIndex - 1]
      setSkippedFlags(prev => prev.filter(f => f !== prevFlag))
      setCurrentIndex(currentIndex - 1)
      setInput('')
      setCurrentAttempts([])
      setPendingWrongMatch(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      goBack()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      skipFlag()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
        <span className="text-gray-400">Laster...</span>
      </div>
    )
  }

  if (!quizStarted) {
    const worldCount = Object.keys(countryFlags).length
    const europeCount = europeanCountries.length
    const territoryCount = Object.keys(territoryFlags).length

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
        <h1 className="text-white text-3xl font-bold mb-8 text-center">Flaggquiz</h1>
        <p className="text-gray-400 mb-6 text-center">
          Gjett det norske navnet på landene
        </p>
        <label className="flex items-center gap-3 mb-8 cursor-pointer">
          <input
            type="checkbox"
            checked={!timerEnabled}
            onChange={(e) => setTimerEnabled(!e.target.checked)}
            className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-300">Uten tidsbegrensning</span>
        </label>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => startQuiz('world')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
          >
            Hele verden
            <span className="block text-sm font-normal opacity-80">{worldCount} land - 15 min</span>
          </button>
          <button
            onClick={() => startQuiz('europe')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
          >
            Kun Europa
            <span className="block text-sm font-normal opacity-80">{europeCount} land - 10 min</span>
          </button>
          <button
            onClick={() => startQuiz('territories')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
          >
            Territorier
            <span className="block text-sm font-normal opacity-80">{territoryCount} territorier - 3 min</span>
          </button>
        </div>
      </div>
    )
  }

  if (quizFinished) {
    const failedFlags = quizOrder.filter(country => !correctFlags.has(country))
    const struggledOnly = quizOrder.filter(country => correctFlags.has(country) && struggledFlags.has(country))
    // Show failed and struggled flags in quiz order
    const problemFlags = quizOrder.filter(country =>
      !correctFlags.has(country) || struggledFlags.has(country)
    )
    const displayFlags = showAllResults ? quizOrder : problemFlags
    const quizTypeName = quizType === 'territories' ? 'Territorier' : quizType === 'europe' ? 'Europa' : 'Verden'

    return (
      <div className="min-h-screen flex flex-col p-4" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-2">{quizTypeName}</p>
          <h1 className="text-white text-3xl font-bold mb-2">
            {completedCount === totalFlags ? 'Gratulerer!' : timerEnabled ? 'Tiden er ute!' : 'Resultat'}
          </h1>
          <p className="text-gray-400 text-xl mb-4">
            Du klarte {completedCount} av {totalFlags} flagg
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startQuiz(quizType)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
            >
              Prøv igjen
            </button>
            <button
              onClick={goToStartScreen}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              Velg quiz
            </button>
          </div>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowAllResults(false)}
            className={`px-4 py-2 rounded-l-lg ${!showAllResults ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Feil ({failedFlags.length}){struggledOnly.length > 0 && ` + ${struggledOnly.length} slitt`}
          </button>
          <button
            onClick={() => setShowAllResults(true)}
            className={`px-4 py-2 rounded-r-lg ${showAllResults ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Alle ({totalFlags})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {displayFlags.map(country => {
              const isCorrect = correctFlags.has(country)
              const isStruggled = struggledFlags.has(country)
              const attempts = struggledFlags.get(country)
              const flagUrl = currentFlags[country as keyof typeof currentFlags]
              const name = getQuizName(country)

              let bgColor = 'bg-red-900/30'
              let textColor = 'text-red-400'
              if (isCorrect && isStruggled) {
                bgColor = 'bg-yellow-900/30'
                textColor = 'text-yellow-400'
              } else if (isCorrect) {
                bgColor = 'bg-green-900/30'
                textColor = 'text-green-400'
              }

              return (
                <div
                  key={country}
                  className={`flex flex-col items-center p-2 rounded-lg ${bgColor}`}
                >
                  <img
                    src={flagUrl}
                    alt={name}
                    className="w-20 h-12 object-contain mb-1"
                  />
                  <span className={`text-xs text-center ${textColor}`}>
                    {name}
                  </span>
                  {isStruggled && attempts && (
                    <span className="text-xs text-gray-500 text-center mt-1">
                      Prøvde: {attempts.map(c => getQuizName(c)).join(', ')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const flagUrl = currentFlags[currentCountry as keyof typeof currentFlags]
  const remainingInRound = currentQueue.length - currentIndex - 1
  const skippedCount = skippedFlags.length
  const quizTypeName = quizType === 'territories' ? 'Territorier' : quizType === 'europe' ? 'Europa' : 'Verden'

  return (
    <div className="min-h-screen flex flex-col p-4" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0f0f1a 70%)' }}>
      <div className="flex-1 flex flex-col items-center pt-2 sm:pt-8">
        <div className="w-full max-w-sm mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white text-xl font-mono">{timerEnabled ? formatTime(timeRemaining) : '∞'}</span>
            <span className="text-green-500 text-lg font-bold">{completedCount} riktige</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{quizTypeName} - Runde {round}</span>
            <div className="flex gap-4">
              <span className="text-gray-400">{remainingInRound} igjen</span>
              <span className="text-yellow-500">{skippedCount} hoppet over</span>
            </div>
          </div>
        </div>

        <img
          src={flagUrl}
          alt="Flagg"
          className="w-full max-w-sm h-48 object-contain mb-4"
        />

        <div className="w-full max-w-sm mb-4">
          <input
            ref={inputRef}
            type="text"
            value={justAnswered ? correctAnswer : input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Skriv landets navn..."
            className={`w-full text-white rounded-lg px-4 py-3 text-lg focus:outline-none transition-colors duration-150 ${
              justAnswered
                ? 'bg-green-600 border-green-500 border-2 font-bold'
                : 'bg-gray-900 border border-gray-700 focus:border-blue-500'
            }`}
            autoComplete="off"
            autoCapitalize="off"
            readOnly={justAnswered}
          />
        </div>

        <button
          onClick={skipFlag}
          className="w-full max-w-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg mb-3"
        >
          Hopp over <span className="text-gray-400 text-sm">(Tab / Shift+Tab tilbake)</span>
        </button>

        <div className="flex gap-4">
          <button
            onClick={giveUp}
            className="text-gray-500 hover:text-gray-400 text-sm underline"
          >
            Gi opp
          </button>
          <button
            onClick={() => startQuiz(quizType)}
            className="text-gray-500 hover:text-gray-400 text-sm underline"
          >
            Start på nytt
          </button>
        </div>
      </div>
    </div>
  )
}
