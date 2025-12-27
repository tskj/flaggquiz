import { useState, useEffect, useRef, useCallback } from 'react'
import countryFlags from '../country-flags.json'
import territoryFlags from '../disputed-territories.json'
import { checkAnswer as matchAnswer, isStrictMatch } from './fuzzyMatch'
import { loadActiveSession, saveActiveSession, clearActiveSession, addToHistory, getHighScores, isMapQuiz, getBaseQuizType, type QuizSession, type QuizType } from './storage'
import { CountryMap, preloadMapData } from './CountryMap'

// Start preloading map data immediately
preloadMapData()

// Countries by continent (English names matching country-flags.json keys)
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

export const africanCountries = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon',
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros',
  'Democratic Republic of the Congo', 'Republic of the Congo', 'Djibouti', 'Egypt',
  'Equatorial Guinea', 'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana',
  'Guinea', 'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 'Mozambique',
  'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 'Senegal',
  'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 'Sudan',
  'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
]

export const asianCountries = [
  'Afghanistan', 'Armenia', 'Azerbaijan', 'Bahrain', 'Bangladesh', 'Bhutan', 'Brunei',
  'Cambodia', 'China', 'Georgia', 'India', 'Indonesia', 'Iran', 'Iraq', 'Israel',
  'Japan', 'Jordan', 'Kazakhstan', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Lebanon',
  'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Oman',
  'Pakistan', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Korea',
  'Sri Lanka', 'Syria', 'Taiwan', 'Tajikistan', 'Thailand', 'Timor-Leste', 'Turkey',
  'Turkmenistan', 'United Arab Emirates', 'Uzbekistan', 'Vietnam', 'Yemen'
]

export const northAmericanCountries = [
  'Antigua and Barbuda', 'Bahamas', 'Barbados', 'Belize', 'Canada', 'Costa Rica',
  'Cuba', 'Dominica', 'Dominican Republic', 'El Salvador', 'Grenada', 'Guatemala',
  'Haiti', 'Honduras', 'Jamaica', 'Mexico', 'Nicaragua', 'Panama',
  'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Trinidad and Tobago', 'United States'
]

export const southAmericanCountries = [
  'Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Guyana',
  'Paraguay', 'Peru', 'Suriname', 'Uruguay', 'Venezuela'
]

export const oceanianCountries = [
  'Australia', 'Fiji', 'Kiribati', 'Marshall Islands', 'Micronesia', 'Nauru',
  'New Zealand', 'Palau', 'Papua New Guinea', 'Samoa', 'Solomon Islands', 'Tonga',
  'Tuvalu', 'Vanuatu'
]

// Territories that have map data in world-atlas (for map-territories quiz)
export const mapTerritories = [
  'Greenland', 'Palestine', 'Sahrawi Arab Democratic Republic'
]

// Norwegian names for disputed territories
export const territoryNorwegianNames: Record<string, string> = {
  "Abkhazia": "Abkhasia",
  "Cook Islands": "Cookøyene",
  "England": "England",
  "Greenland": "Grønland",
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
  const [practiceMode, setPracticeMode] = useState(false)
  const [hasSeenAll, setHasSeenAll] = useState(false)  // Have we gone through all flags at least once?
  const [justAnswered, setJustAnswered] = useState(false)
  const [quizOrder, setQuizOrder] = useState<string[]>([])
  const [correctFlags, setCorrectFlags] = useState<Set<string>>(new Set())
  const [showAllResults, setShowAllResults] = useState(false)
  const [struggledFlags, setStruggledFlags] = useState<Map<string, string[]>>(new Map())
  const [currentAttempts, setCurrentAttempts] = useState<string[]>([])
  const [pendingWrongMatch, setPendingWrongMatch] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuizType>('world')
  const inputRef = useRef<HTMLInputElement>(null)

  // Derived state - computed during render, not via useEffect
  const completedCount = correctFlags.size

  // Get the appropriate flags and names based on quiz type
  const getQuizFlags = (type: QuizType) => {
    const baseType = getBaseQuizType(type)
    return baseType === 'territories' ? territoryFlags : countryFlags
  }
  const getQuizName = (country: string) => {
    const baseType = getBaseQuizType(quizType)
    if (baseType === 'territories') {
      return territoryNorwegianNames[country] || country
    }
    return norwegianNames[country] || country
  }

  const getQuizCount = (type: QuizType): number => {
    const baseType = getBaseQuizType(type)
    switch (baseType) {
      case 'europe': return europeanCountries.length
      case 'africa': return africanCountries.length
      case 'asia': return asianCountries.length
      case 'north-america': return northAmericanCountries.length
      case 'south-america': return southAmericanCountries.length
      case 'oceania': return oceanianCountries.length
      case 'territories': return isMapQuiz(type) ? mapTerritories.length : Object.keys(territoryFlags).length
      default: return Object.keys(countryFlags).length
    }
  }

  const getQuizTypeName = (type: QuizType): string => {
    const baseType = getBaseQuizType(type)
    const prefix = isMapQuiz(type) ? 'Kart: ' : ''
    switch (baseType) {
      case 'europe': return prefix + 'Europa'
      case 'africa': return prefix + 'Afrika'
      case 'asia': return prefix + 'Asia'
      case 'north-america': return prefix + 'Nord-Amerika'
      case 'south-america': return prefix + 'Sør-Amerika'
      case 'oceania': return prefix + 'Oseania'
      case 'territories': return prefix + 'Ymse territorier'
      default: return prefix + 'Verden'
    }
  }

  const currentFlags = getQuizFlags(quizType)
  const totalFlags = getQuizCount(quizType)
  const baseQuizType = getBaseQuizType(quizType)
  const allNorwegianNames = baseQuizType === 'territories'
    ? (isMapQuiz(quizType) ? mapTerritories : Object.keys(territoryFlags)).map(c => territoryNorwegianNames[c] || c)
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
      timerEnabled: !practiceMode,  // Storage uses timerEnabled for backwards compat
      timeRemaining,
      quizType,
      quizOrder,
      currentQueue,
      currentIndex,
      skippedFlags,
      round: hasSeenAll ? 2 : 1,  // Storage uses round for backwards compat
      correctFlags: Array.from(correctFlags),
      struggledFlags: Object.fromEntries(struggledFlags),
      currentAttempts,
      pendingWrongMatch,
      input,
    }
  }, [sessionId, quizFinished, practiceMode, timeRemaining, quizType, quizOrder, currentQueue, currentIndex, skippedFlags, hasSeenAll, correctFlags, struggledFlags, currentAttempts, pendingWrongMatch, input])

  // Load session on mount
  useEffect(() => {
    const saved = loadActiveSession()
    if (saved) {
      setSessionId(saved.id)
      setQuizStarted(true)
      setQuizFinished(!!saved.finishedAt)
      setPracticeMode(!saved.timerEnabled)
      setTimeRemaining(saved.timeRemaining)
      setQuizType(saved.quizType || 'world')
      setQuizOrder(saved.quizOrder)
      setCurrentQueue(saved.currentQueue)
      setCurrentIndex(saved.currentIndex)
      setSkippedFlags(saved.skippedFlags)
      setHasSeenAll(saved.round > 1)  // round > 1 means we've seen all at least once
      setCorrectFlags(new Set(saved.correctFlags))
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
  // Skip for practice mode - no history tracking
  useEffect(() => {
    // Skip if already finished when loaded (already in history)
    if (wasFinishedOnLoad.current) return

    if (quizFinished && sessionId && !hasMovedToHistory.current) {
      hasMovedToHistory.current = true
      const session = buildSession()
      if (session) {
        session.finishedAt = Date.now()
        // Only add to history (for highscores) if not in practice mode
        if (!practiceMode) {
          addToHistory(session)
        }
        // Don't clear active session - keep it for refresh on results screen
        saveActiveSession(session)
      }
    }
    if (!quizFinished) {
      hasMovedToHistory.current = false
    }
  }, [quizFinished, sessionId, buildSession, practiceMode])

  useEffect(() => {
    if (!quizStarted || quizFinished || practiceMode) return

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
  }, [quizStarted, quizFinished, practiceMode])

  useEffect(() => {
    if (quizStarted && !quizFinished && inputRef.current) {
      // preventScroll to avoid mobile keyboard pushing content out of view
      inputRef.current.focus({ preventScroll: true })
    }
  }, [quizStarted, quizFinished, currentIndex, hasSeenAll])


  // Countries without map data in world-atlas (political reasons)
  const countriesWithoutMapData = ['Kosovo']

  const getCountriesForType = (type: QuizType): string[] => {
    const baseType = getBaseQuizType(type)
    let countries: string[]
    switch (baseType) {
      case 'europe': countries = europeanCountries.filter(c => c in countryFlags); break
      case 'africa': countries = africanCountries.filter(c => c in countryFlags); break
      case 'asia': countries = asianCountries.filter(c => c in countryFlags); break
      case 'north-america': countries = northAmericanCountries.filter(c => c in countryFlags); break
      case 'south-america': countries = southAmericanCountries.filter(c => c in countryFlags); break
      case 'oceania': countries = oceanianCountries.filter(c => c in countryFlags); break
      case 'territories':
        // For map quiz, only use territories with map data
        countries = isMapQuiz(type) ? mapTerritories : Object.keys(territoryFlags)
        break
      default: countries = Object.keys(countryFlags)
    }
    // Filter out countries without map data for map quizzes (except territories which are already filtered)
    if (isMapQuiz(type) && baseType !== 'territories') {
      countries = countries.filter(c => !countriesWithoutMapData.includes(c))
    }
    return countries
  }

  const getDefaultTime = (type: QuizType): number => {
    const baseType = getBaseQuizType(type)
    switch (baseType) {
      case 'territories': return isMapQuiz(type) ? 1 * 60 : 3 * 60
      case 'oceania': return 5 * 60
      case 'south-america': return 5 * 60
      case 'north-america': return 8 * 60
      case 'europe': return 10 * 60
      case 'africa': return 12 * 60
      case 'asia': return 12 * 60
      default: return 15 * 60
    }
  }

  const startQuiz = (type: QuizType = 'world') => {
    clearActiveSession()
    const allCountries = getCountriesForType(type)
    const shuffled = shuffleArray(allCountries)
    const newSessionId = Date.now().toString()
    const defaultTime = getDefaultTime(type)
    setSessionId(newSessionId)
    setQuizType(type)
    setCurrentQueue(shuffled)
    setQuizOrder(shuffled)
    setSkippedFlags([])
    setCurrentIndex(0)
    setTimeRemaining(defaultTime)
    setHasSeenAll(false)
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
      // We've now seen all flags at least once
      setHasSeenAll(true)
      // Keep original order from quizOrder for subsequent passes
      const orderedSkipped = newSkipped.sort((a, b) => quizOrder.indexOf(a) - quizOrder.indexOf(b))
      setCurrentQueue(orderedSkipped)
      setSkippedFlags([])
      setCurrentIndex(0)
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
    const flagQuizOptions: { type: QuizType; color: string }[] = [
      { type: 'world', color: 'bg-blue-600 hover:bg-blue-700' },
      { type: 'europe', color: 'bg-green-600 hover:bg-green-700' },
      { type: 'africa', color: 'bg-yellow-600 hover:bg-yellow-700' },
      { type: 'asia', color: 'bg-red-600 hover:bg-red-700' },
      { type: 'north-america', color: 'bg-orange-600 hover:bg-orange-700' },
      { type: 'south-america', color: 'bg-teal-600 hover:bg-teal-700' },
      { type: 'oceania', color: 'bg-cyan-600 hover:bg-cyan-700' },
      { type: 'territories', color: 'bg-purple-600 hover:bg-purple-700' },
    ]
    const mapQuizOptions: { type: QuizType; color: string }[] = [
      { type: 'map-world', color: 'bg-blue-800 hover:bg-blue-900' },
      { type: 'map-europe', color: 'bg-green-800 hover:bg-green-900' },
      { type: 'map-africa', color: 'bg-yellow-800 hover:bg-yellow-900' },
      { type: 'map-asia', color: 'bg-red-800 hover:bg-red-900' },
      { type: 'map-north-america', color: 'bg-orange-800 hover:bg-orange-900' },
      { type: 'map-south-america', color: 'bg-teal-800 hover:bg-teal-900' },
      { type: 'map-oceania', color: 'bg-cyan-800 hover:bg-cyan-900' },
      { type: 'map-territories', color: 'bg-purple-800 hover:bg-purple-900' },
    ]
    const highScores = getHighScores()

    const renderQuizButton = ({ type, color }: { type: QuizType; color: string }) => {
      const highScore = highScores[type]
      const baseType = getBaseQuizType(type)
      return (
        <button
          key={type}
          onClick={() => startQuiz(type)}
          className={`${color} text-white font-bold py-3 px-4 rounded-lg text-lg relative`}
        >
          {highScore && (
            <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScore.percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
              ⭐ {highScore.correct}/{highScore.total}
            </span>
          )}
          {getQuizTypeName(type)}
          <span className="block text-xs font-normal opacity-80">
            {getQuizCount(type)} {baseType === 'territories' ? 'territorier' : 'land'}
            <span className={practiceMode ? 'line-through opacity-50' : ''}> - {Math.floor(getDefaultTime(type) / 60)} min</span>
          </span>
        </button>
      )
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
        <h1 className="text-white text-3xl font-bold mb-6 text-center">Flaggquiz</h1>
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={(e) => setPracticeMode(e.target.checked)}
            className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-300">Øvemodus</span>
          <span className="text-gray-500 text-sm">(ingen tidtaking eller highscore)</span>
        </label>

        <h2 className="text-gray-400 text-sm mb-2">Flagg</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          {flagQuizOptions.map(renderQuizButton)}
        </div>

        <h2 className="text-gray-400 text-sm mb-2">Kart</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          {mapQuizOptions.map(renderQuizButton)}
        </div>
      </div>
    )
  }

  if (quizFinished) {
    // Calculate which flags were never reached (still in queue after current position when quiz ended)
    // But exclude skipped flags - those were seen and should show as red, not gray
    // If hasSeenAll is true, all flags were seen at least once, so nothing is "unreached"
    const unreachedFlags = hasSeenAll
      ? new Set<string>()
      : new Set(currentQueue.slice(currentIndex + 1).filter(f => !skippedFlags.includes(f)))

    const failedFlags = quizOrder.filter(country => !correctFlags.has(country) && !unreachedFlags.has(country))
    const struggledOnly = quizOrder.filter(country => correctFlags.has(country) && struggledFlags.has(country))
    // Show failed, struggled, and unreached flags in quiz order
    const problemFlags = quizOrder.filter(country =>
      !correctFlags.has(country) || struggledFlags.has(country)
    )
    const displayFlags = showAllResults ? quizOrder : problemFlags
    const quizTypeName = getQuizTypeName(quizType)

    return (
      <div className="min-h-screen flex flex-col p-4" style={{ background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0f0f1a 100%)' }}>
        <div className="text-center mb-6">
          <p className="text-gray-500 text-sm mb-2">{quizTypeName}{practiceMode && ' (øvemodus)'}</p>
          <h1 className="text-white text-3xl font-bold mb-2">
            {completedCount === totalFlags ? 'Gratulerer!' : !practiceMode ? 'Tiden er ute!' : 'Resultat'}
          </h1>
          <p className="text-gray-400 text-xl mb-4">
            Du klarte {completedCount} av {totalFlags} {isMapQuiz(quizType) ? 'land' : 'flagg'}
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
            Feil ({failedFlags.length + unreachedFlags.size}){struggledOnly.length > 0 && ` + ${struggledOnly.length} slitt`}
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
              const isUnreached = unreachedFlags.has(country)
              const attempts = struggledFlags.get(country)
              const flagUrl = currentFlags[country as keyof typeof currentFlags]
              const name = getQuizName(country)

              let bgColor = 'bg-red-900/30'
              let textColor = 'text-red-400'
              if (isUnreached) {
                // Unreached: dark/neutral color (not red)
                bgColor = 'bg-gray-800/50'
                textColor = 'text-gray-500'
              } else if (isCorrect && isStruggled) {
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
                  {isMapQuiz(quizType) ? (
                    <div className="w-20 h-12 mb-1">
                      <CountryMap highlightedCountry={country} width={80} height={48} mode="overview" />
                    </div>
                  ) : (
                    <img
                      src={flagUrl}
                      alt={name}
                      className="w-20 h-12 object-contain mb-1"
                    />
                  )}
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
  // Count inclusive of current flag
  const remainingIncludingCurrent = currentQueue.length - currentIndex
  const skippedCount = skippedFlags.length
  const quizTypeName = getQuizTypeName(quizType)

  // Build the remaining text (used before hasSeenAll)
  const remainingText = remainingIncludingCurrent === 1 ? 'Siste!' : `${remainingIncludingCurrent} igjen`

  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-4" style={{ background: 'radial-gradient(ellipse at 50% 30%, #1a1a2e 0%, #0f0f1a 70%)' }}>
      <div className="flex-1 flex flex-col items-center pt-1 sm:pt-4 lg:pt-8">
        <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-1 sm:mb-2">
          <div className="flex justify-between items-center mb-1">
            {!practiceMode && <span className="text-white text-lg sm:text-xl lg:text-2xl font-mono">{formatTime(timeRemaining)}</span>}
            <span className={`text-green-500 text-base sm:text-lg lg:text-xl font-bold ${practiceMode ? 'ml-auto' : ''}`}>{completedCount} riktige</span>
          </div>
          <div className="flex justify-between items-center text-xs sm:text-sm lg:text-base">
            <span className="text-gray-500">{quizTypeName}</span>
            <div className="flex gap-2 sm:gap-4">
              {hasSeenAll ? (
                // After seeing all, show total bucket size (remaining + already skipped this pass)
                (() => {
                  const totalBucket = remainingIncludingCurrent + skippedCount
                  return (
                    <span className={totalBucket === 1 ? 'text-yellow-400 font-bold' : 'text-yellow-500'}>
                      {totalBucket === 1 ? 'Siste!' : `${totalBucket} hoppet over`}
                    </span>
                  )
                })()
              ) : (
                <>
                  <span className={remainingIncludingCurrent === 1 ? 'text-yellow-400 font-bold' : 'text-gray-400'}>{remainingText}</span>
                  {skippedCount > 0 && (
                    <span className="text-yellow-500">{skippedCount} hoppet over</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isMapQuiz(quizType) ? (
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg aspect-video mb-2 sm:mb-4">
            <CountryMap highlightedCountry={currentCountry} width={512} height={288} allowZoomToggle={!practiceMode} />
          </div>
        ) : (
          <img
            src={flagUrl}
            alt="Flagg"
            className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg h-36 sm:h-48 lg:h-72 object-contain mb-2 sm:mb-4"
          />
        )}

        <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4">
          <input
            ref={inputRef}
            type="text"
            value={justAnswered ? correctAnswer : input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Skriv landets navn..."
            className={`w-full text-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg lg:text-xl focus:outline-none transition-colors duration-150 ${
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
          className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-lg mb-2 sm:mb-3 text-sm sm:text-base lg:text-lg"
        >
          Hopp over <span className="text-gray-400 text-xs sm:text-sm">(Tab / Shift+Tab tilbake)</span>
        </button>

        <div className="flex gap-4">
          <button
            onClick={giveUp}
            className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm underline"
          >
            Gi opp
          </button>
          <button
            onClick={() => startQuiz(quizType)}
            className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm underline"
          >
            Start på nytt
          </button>
        </div>
      </div>
    </div>
  )
}
