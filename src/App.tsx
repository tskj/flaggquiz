import { useState, useEffect, useRef, useCallback } from 'react'
import countryFlags from '../country-flags.json'
import territoryFlags from '../disputed-territories.json'
import { checkAnswer as matchAnswer, isStrictMatch } from './fuzzyMatch'
import { loadActiveSession, saveActiveSession, clearActiveSession, addToHistory, getHighScores, isMapQuiz, isKidsQuiz, isKidsFlagQuiz, isKidsMapQuiz, isCapitalQuiz, isCapitalInputQuiz, isCapitalChoiceQuiz, getBaseQuizType, type QuizSession, type QuizType } from './storage'
import { CountryMap, preloadMapData } from './CountryMap'
import { PrerenderedCountryMap } from './PrerenderedCountryMap'
import { getQuizOptions } from './kidsQuizData'
import { europeanCapitals, getCapitalAlternatives, capitalCoordinates } from './europeanCapitals'

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(15 * 60)
  const [practiceMode, setPracticeMode] = useState(false)
  const [kidsMode, setKidsMode] = useState(false)
  const [currentOptions, setCurrentOptions] = useState<string[]>([])
  const [capitalChoiceTypes, setCapitalChoiceTypes] = useState<('name' | 'flag' | 'map')[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [justAnswered, setJustAnswered] = useState(false)
  const [quizOrder, setQuizOrder] = useState<string[]>([])
  const [correctFlags, setCorrectFlags] = useState<Set<string>>(new Set())
  const [seenFlags, setSeenFlags] = useState<Set<string>>(new Set())  // All flags ever shown (only grows)
  const [resultsTab, setResultsTab] = useState<'wrong' | 'practice' | 'all' | null>(null)
  const [struggledFlags, setStruggledFlags] = useState<Map<string, string[]>>(new Map())
  const [currentAttempts, setCurrentAttempts] = useState<string[]>([])
  const [pendingWrongMatch, setPendingWrongMatch] = useState<string | null>(null)
  const [quizType, setQuizType] = useState<QuizType>('world')
  const inputRef = useRef<HTMLInputElement>(null)

  // Derived state - computed during render, not via useEffect
  const completedCount = correctFlags.size
  const hasSeenAll = seenFlags.size >= quizOrder.length && quizOrder.length > 0

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

  // Countries without map data in world-atlas (filtered out for map quizzes)
  const countriesWithoutMapData = ['Kosovo']

  // Countries where capital name = country name (trivial for capital quiz)
  const countriesWithSameCapital = ['Luxembourg', 'Monaco', 'San Marino', 'Vatican City']

  const getQuizCount = (type: QuizType): number => {
    // Capital quizzes - filter out countries without map data and trivial same-name capitals
    if (type === 'capital-input-europe') {
      return europeanCountries.filter(c => c in europeanCapitals && !countriesWithoutMapData.includes(c) && !countriesWithSameCapital.includes(c)).length
    }
    if (type === 'capital-choice-europe') {
      return europeanCountries.filter(c => c in europeanCapitals && !countriesWithoutMapData.includes(c) && !countriesWithSameCapital.includes(c)).length
    }
    const baseType = getBaseQuizType(type)
    const mapFilter = isMapQuiz(type) ? countriesWithoutMapData.length : 0
    switch (baseType) {
      case 'europe': return europeanCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => europeanCountries.includes(c)).length : 0)
      case 'africa': return africanCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => africanCountries.includes(c)).length : 0)
      case 'asia': return asianCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => asianCountries.includes(c)).length : 0)
      case 'north-america': return northAmericanCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => northAmericanCountries.includes(c)).length : 0)
      case 'south-america': return southAmericanCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => southAmericanCountries.includes(c)).length : 0)
      case 'oceania': return oceanianCountries.length - (isMapQuiz(type) ? countriesWithoutMapData.filter(c => oceanianCountries.includes(c)).length : 0)
      case 'territories': return isMapQuiz(type) ? mapTerritories.length : Object.keys(territoryFlags).length
      default: return Object.keys(countryFlags).length - mapFilter
    }
  }

  const getQuizTypeName = (type: QuizType): string => {
    if (type === 'kids-europe') return 'Europas flagg'
    if (type === 'kids-map-europe') return 'Europas land'
    if (type === 'kids-world') return 'Verdens flagg'
    if (type === 'kids-map-world') return 'Verdens land'
    if (type === 'capital-input-europe') return 'Hovedsteder (skriv)'
    if (type === 'capital-choice-europe') return 'Hovedsteder (flervalg)'
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
  // Derives skippedFlags from current queue state for backwards-compatible storage
  const buildSession = useCallback((): QuizSession | null => {
    if (!sessionId) return null
    // For storage: skippedFlags = flags in current queue that we've passed but not answered correctly
    const skippedInCurrentPass = currentQueue.slice(0, currentIndex).filter(f => !correctFlags.has(f))
    return {
      id: sessionId,
      startedAt: parseInt(sessionId),
      finishedAt: quizFinished ? Date.now() : undefined,
      timerEnabled: !practiceMode,
      timeRemaining,
      quizType,
      quizOrder,
      currentQueue,
      currentIndex,
      skippedFlags: skippedInCurrentPass,
      round: hasSeenAll ? 2 : 1,
      correctFlags: Array.from(correctFlags),
      struggledFlags: Object.fromEntries(struggledFlags),
      currentAttempts,
      pendingWrongMatch,
      input,
      kidsMode,
      currentOptions,
      capitalChoiceTypes,
    }
  }, [sessionId, quizFinished, practiceMode, kidsMode, timeRemaining, quizType, quizOrder, currentQueue, currentIndex, hasSeenAll, correctFlags, struggledFlags, currentAttempts, pendingWrongMatch, input, currentOptions, capitalChoiceTypes])

  // Load session on mount
  useEffect(() => {
    const saved = loadActiveSession()
    if (saved) {
      setSessionId(saved.id)
      setQuizStarted(true)
      setQuizFinished(!!saved.finishedAt)
      setKidsMode(saved.kidsMode || isKidsQuiz(saved.quizType || 'world'))
      setPracticeMode(!saved.timerEnabled)
      setTimeRemaining(saved.timeRemaining)
      setQuizType(saved.quizType || 'world')
      setQuizOrder(saved.quizOrder)
      setCurrentQueue(saved.currentQueue)
      setCurrentIndex(saved.currentIndex)
      setCorrectFlags(new Set(saved.correctFlags))
      setStruggledFlags(new Map(Object.entries(saved.struggledFlags)))
      setCurrentAttempts(saved.currentAttempts)
      setPendingWrongMatch(saved.pendingWrongMatch)
      setInput(saved.input)
      setCurrentOptions(saved.currentOptions || [])
      setCapitalChoiceTypes(saved.capitalChoiceTypes || [])
      // Reconstruct seenFlags from saved state
      // If round > 1, all flags have been seen; otherwise, it's correct + skipped + current queue up to index
      if (saved.round > 1) {
        setSeenFlags(new Set(saved.quizOrder))
      } else {
        const seen = new Set([
          ...saved.correctFlags,
          ...saved.skippedFlags,
          ...saved.currentQueue.slice(0, saved.currentIndex)
        ])
        setSeenFlags(seen)
      }
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

  // Generate random choice types for capital choice quiz (mix of name, flag, map)
  const generateCapitalChoiceTypes = (): ('name' | 'flag' | 'map')[] => {
    const types: ('name' | 'flag' | 'map')[] = ['name', 'flag', 'map']
    // Pick 4 random types (with replacement to ensure variety)
    return [0, 1, 2, 3].map(() => types[Math.floor(Math.random() * types.length)])
  }

  const startQuiz = (type: QuizType = 'world') => {
    clearActiveSession()
    const isKids = isKidsQuiz(type)
    const isCapital = isCapitalQuiz(type)
    // For kids quizzes, determine country list based on type
    let allCountries: string[]
    if (type === 'kids-europe') {
      allCountries = europeanCountries.filter(c => c in countryFlags)
    } else if (type === 'kids-map-europe') {
      allCountries = europeanCountries.filter(c => c in countryFlags && !countriesWithoutMapData.includes(c))
    } else if (type === 'kids-world') {
      allCountries = Object.keys(countryFlags)
    } else if (type === 'kids-map-world') {
      allCountries = Object.keys(countryFlags).filter(c => !countriesWithoutMapData.includes(c))
    } else if (isCapital) {
      // Capital quizzes - European countries with capitals, excluding Kosovo and trivial same-name capitals
      allCountries = europeanCountries.filter(c => c in europeanCapitals && !countriesWithoutMapData.includes(c) && !countriesWithSameCapital.includes(c))
    } else {
      allCountries = getCountriesForType(type)
    }
    const shuffled = shuffleArray(allCountries)
    const newSessionId = Date.now().toString()
    // Kids mode times: Europe 10 min, World 35 min
    // Capital quiz times: input 10 min, choice 5 min
    const kidsTime = (type === 'kids-europe' || type === 'kids-map-europe') ? 10 * 60 : 35 * 60
    const capitalTime = type === 'capital-choice-europe' ? 5 * 60 : 10 * 60
    const defaultTime = isKids ? kidsTime : isCapital ? capitalTime : getDefaultTime(type)
    setSessionId(newSessionId)
    setQuizType(type)
    setKidsMode(isKids)
    // Keep practiceMode from checkbox (don't override)
    setCurrentQueue(shuffled)
    setQuizOrder(shuffled)
    setCurrentIndex(0)
    setTimeRemaining(defaultTime)
    setQuizStarted(true)
    setQuizFinished(false)
    setCorrectFlags(new Set())
    setSeenFlags(new Set([shuffled[0]]))  // First flag is immediately seen
    setResultsTab(null)
    setStruggledFlags(new Map())
    setCurrentAttempts([])
    setInput('')
    setSelectedOption(null)
    setCapitalChoiceTypes([])
    // Generate options for first question in kids mode
    if (isKids && shuffled.length > 0) {
      // For world quizzes, pass the full country list for random distractors
      const useRandomDistractors = type === 'kids-world' || type === 'kids-map-world'
      setCurrentOptions(getQuizOptions(shuffled[0], useRandomDistractors ? allCountries : undefined))
    }
    // Generate options for capital choice quiz
    if (type === 'capital-choice-europe' && shuffled.length > 0) {
      setCurrentOptions(getQuizOptions(shuffled[0], allCountries))
      setCapitalChoiceTypes(generateCapitalChoiceTypes())
    }
  }

  // Helper to get quiz options with correct distractor source
  const getOptionsForCountry = (country: string) => {
    const useRandomDistractors = quizType === 'kids-world' || quizType === 'kids-map-world'
    return getQuizOptions(country, useRandomDistractors ? quizOrder : undefined)
  }

  const currentCountry = currentQueue[currentIndex]
  const correctAnswer = getQuizName(currentCountry)
  const altNames = alternativeNames[currentCountry] || []

  // For capital quizzes, the correct answer is the capital name
  const correctCapital = europeanCapitals[currentCountry] || ''
  const capitalAltNames = getCapitalAlternatives(correctCapital)
  // All capital names for ambiguity checking
  const allCapitalNames = Object.values(europeanCapitals)

  // Check if value matches the correct answer or any alternative name
  const matchesCorrectAnswer = (value: string): boolean => {
    // For capital input quiz, check against capital names
    if (isCapitalInputQuiz(quizType)) {
      const result = matchAnswer(value, correctCapital, allCapitalNames, capitalAltNames, {})
      return result[0] === 'match'
    }
    // For other quizzes, check against country names
    const result = matchAnswer(value, correctAnswer, allNorwegianNames, altNames, norwegianAlternativeNames)
    return result[0] === 'match'
  }

  const checkAnswer = (value: string, prevValue: string) => {
    if (justAnswered) return
    if (matchesCorrectAnswer(value)) {
      setJustAnswered(true)
      const newCorrectFlags = new Set(correctFlags).add(currentCountry)
      setCorrectFlags(newCorrectFlags)
      // If we had attempts before getting it right, mark as struggled
      if (currentAttempts.length > 0) {
        setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts]))
      }
      setCurrentAttempts([])
      setPendingWrongMatch(null)

      // Check if this was the last flag (use newCorrectFlags to avoid stale closure)
      const isLastFlag = currentIndex + 1 >= currentQueue.length &&
        quizOrder.every(f => newCorrectFlags.has(f))

      setTimeout(() => {
        setJustAnswered(false)
        if (isLastFlag) {
          setQuizFinished(true)
        } else {
          moveToNext(false)
        }
      }, 400)
    } else {
      // Check if input is a strict match for any other answer (for tracking wrong attempts)
      // Uses strict matching to avoid false positives like "Tsjekkia" matching "Tsjad"
      let currentMatch: string | null = null
      if (value.trim().length >= 3) {
        if (isCapitalInputQuiz(quizType)) {
          // For capital quiz, check against other capitals
          for (const [country, capital] of Object.entries(europeanCapitals)) {
            if (country === currentCountry) continue
            if (isStrictMatch(value, capital)) {
              currentMatch = capital  // Store the capital name, not country
              break
            }
            // Also check alternative spellings
            const altNames = getCapitalAlternatives(capital)
            for (const alt of altNames) {
              if (isStrictMatch(value, alt)) {
                currentMatch = capital
                break
              }
            }
            if (currentMatch) break
          }
        } else {
          // For other quizzes, check against country names
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

  const moveToNext = (_wasSkipped: boolean) => {
    // Save any attempts made on this flag (even if skipping)
    if (currentAttempts.length > 0) {
      setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts]))
    }

    if (currentIndex + 1 < currentQueue.length) {
      // Move to next flag and mark it as seen
      const nextFlag = currentQueue[currentIndex + 1]
      setSeenFlags(prev => new Set(prev).add(nextFlag))
      setCurrentIndex(currentIndex + 1)
      // Generate new options for kids mode
      if (kidsMode) {
        setCurrentOptions(getOptionsForCountry(nextFlag))
        setSelectedOption(null)
      }
    } else {
      // End of current pass - check for remaining incorrect flags
      const remainingIncorrect = quizOrder.filter(f => !correctFlags.has(f))
      if (remainingIncorrect.length > 0) {
        // Start new pass with remaining flags (in original order)
        setCurrentQueue(remainingIncorrect)
        setCurrentIndex(0)
        // Mark first flag of new pass as seen
        setSeenFlags(prev => new Set(prev).add(remainingIncorrect[0]))
        // Generate new options for kids mode
        if (kidsMode) {
          setCurrentOptions(getOptionsForCountry(remainingIncorrect[0]))
          setSelectedOption(null)
        }
      } else {
        setQuizFinished(true)
      }
    }
    setInput('')
    setCurrentAttempts([])
    setPendingWrongMatch(null)
  }

  // Handle kids mode option selection
  const handleKidsOptionClick = (selectedCountry: string) => {
    if (justAnswered) return  // Prevent double-clicks

    setSelectedOption(selectedCountry)
    const isCorrect = selectedCountry === currentCountry
    setJustAnswered(true)

    if (isCorrect) {
      // Correct answer
      const newCorrectFlags = new Set(correctFlags).add(currentCountry)
      setCorrectFlags(newCorrectFlags)

      // Check if this was the last flag
      const isLastFlag = currentIndex + 1 >= currentQueue.length &&
        quizOrder.every(f => newCorrectFlags.has(f))

      setTimeout(() => {
        if (isLastFlag) {
          setQuizFinished(true)
          setJustAnswered(false)
        } else {
          // Get next flag and options BEFORE updating state
          const nextFlag = currentQueue[currentIndex + 1]
          const nextOptions = getOptionsForCountry(nextFlag)
          // Update all state together
          setCurrentIndex(currentIndex + 1)
          setCurrentOptions(nextOptions)
          setSelectedOption(null)
          setJustAnswered(false)
          setSeenFlags(prev => new Set(prev).add(nextFlag))
          setCurrentAttempts([])
        }
      }, 600)
    } else {
      // Wrong answer - track as struggled, show correct answer, then move on
      setCurrentAttempts(prev => [...prev, selectedCountry])
      setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts, selectedCountry]))

      setTimeout(() => {
        // Get next flag and options BEFORE updating state
        if (currentIndex + 1 < currentQueue.length) {
          const nextFlag = currentQueue[currentIndex + 1]
          const nextOptions = getOptionsForCountry(nextFlag)
          // Update all state together
          setCurrentIndex(currentIndex + 1)
          setCurrentOptions(nextOptions)
          setSelectedOption(null)
          setJustAnswered(false)
          setSeenFlags(prev => new Set(prev).add(nextFlag))
          setCurrentAttempts([])
        } else {
          // End of queue - handle round completion
          const remainingIncorrect = quizOrder.filter(f => !correctFlags.has(f))
          if (remainingIncorrect.length > 0) {
            const nextFlag = remainingIncorrect[0]
            const nextOptions = getOptionsForCountry(nextFlag)
            setCurrentQueue(remainingIncorrect)
            setCurrentIndex(0)
            setCurrentOptions(nextOptions)
            setSelectedOption(null)
            setJustAnswered(false)
            setSeenFlags(prev => new Set(prev).add(nextFlag))
            setCurrentAttempts([])
          } else {
            setQuizFinished(true)
            setJustAnswered(false)
          }
        }
      }, 1200)  // Longer delay to show correct answer
    }
  }

  // Handle capital choice quiz option selection
  const handleCapitalChoiceClick = (selectedCountry: string) => {
    if (justAnswered) return  // Prevent double-clicks

    setSelectedOption(selectedCountry)
    const isCorrect = selectedCountry === currentCountry
    setJustAnswered(true)

    if (isCorrect) {
      // Correct answer
      const newCorrectFlags = new Set(correctFlags).add(currentCountry)
      setCorrectFlags(newCorrectFlags)

      // Check if this was the last question
      const isLastQuestion = currentIndex + 1 >= currentQueue.length &&
        quizOrder.every(f => newCorrectFlags.has(f))

      setTimeout(() => {
        if (isLastQuestion) {
          setQuizFinished(true)
          setJustAnswered(false)
        } else {
          // Get next question and options BEFORE updating state
          const nextCountry = currentQueue[currentIndex + 1]
          const nextOptions = getQuizOptions(nextCountry, quizOrder)
          // Update all state together
          setCurrentIndex(currentIndex + 1)
          setCurrentOptions(nextOptions)
          setCapitalChoiceTypes(generateCapitalChoiceTypes())
          setSelectedOption(null)
          setJustAnswered(false)
          setSeenFlags(prev => new Set(prev).add(nextCountry))
          setCurrentAttempts([])
        }
      }, 600)
    } else {
      // Wrong answer - track as struggled, show correct answer, then move on
      setCurrentAttempts(prev => [...prev, selectedCountry])
      setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts, selectedCountry]))

      setTimeout(() => {
        // Get next question and options BEFORE updating state
        if (currentIndex + 1 < currentQueue.length) {
          const nextCountry = currentQueue[currentIndex + 1]
          const nextOptions = getQuizOptions(nextCountry, quizOrder)
          // Update all state together
          setCurrentIndex(currentIndex + 1)
          setCurrentOptions(nextOptions)
          setCapitalChoiceTypes(generateCapitalChoiceTypes())
          setSelectedOption(null)
          setJustAnswered(false)
          setSeenFlags(prev => new Set(prev).add(nextCountry))
          setCurrentAttempts([])
        } else {
          // End of queue - handle round completion
          const remainingIncorrect = quizOrder.filter(f => !correctFlags.has(f))
          if (remainingIncorrect.length > 0) {
            const nextCountry = remainingIncorrect[0]
            const nextOptions = getQuizOptions(nextCountry, quizOrder)
            setCurrentQueue(remainingIncorrect)
            setCurrentIndex(0)
            setCurrentOptions(nextOptions)
            setCapitalChoiceTypes(generateCapitalChoiceTypes())
            setSelectedOption(null)
            setJustAnswered(false)
            setSeenFlags(prev => new Set(prev).add(nextCountry))
            setCurrentAttempts([])
          } else {
            setQuizFinished(true)
            setJustAnswered(false)
          }
        }
      }, 1200)  // Longer delay to show correct answer
    }
  }

  const goBack = () => {
    if (currentIndex > 0) {
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
        <h1 className="text-white text-3xl font-bold mb-6 text-center">Alle Verdens Land</h1>

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

        {/* Kids mode section */}
        <h2 className="text-gray-400 text-sm mb-2">For alle</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-4">
          <button
            onClick={() => startQuiz('kids-europe')}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['kids-europe'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['kids-europe'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['kids-europe'].correct}/{highScores['kids-europe'].total}
              </span>
            )}
            Europas flagg
            <span className="block text-sm font-normal opacity-90">{europeanCountries.length} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 10 min</span></span>
          </button>
          <button
            onClick={() => startQuiz('kids-map-europe')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['kids-map-europe'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['kids-map-europe'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['kids-map-europe'].correct}/{highScores['kids-map-europe'].total}
              </span>
            )}
            Europas land
            <span className="block text-sm font-normal opacity-90">{getQuizCount('kids-map-europe')} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 10 min</span></span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          <button
            onClick={() => startQuiz('kids-world')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['kids-world'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['kids-world'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['kids-world'].correct}/{highScores['kids-world'].total}
              </span>
            )}
            Verdens flagg
            <span className="block text-sm font-normal opacity-90">{Object.keys(countryFlags).length} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 35 min</span></span>
          </button>
          <button
            onClick={() => startQuiz('kids-map-world')}
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['kids-map-world'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['kids-map-world'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['kids-map-world'].correct}/{highScores['kids-map-world'].total}
              </span>
            )}
            Verdens land
            <span className="block text-sm font-normal opacity-90">{getQuizCount('kids-map-world')} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 35 min</span></span>
          </button>
        </div>

        {/* For Turid section - Capital quizzes */}
        <h2 className="text-gray-400 text-sm mb-2">For Turid</h2>
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6">
          <button
            onClick={() => startQuiz('capital-input-europe')}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['capital-input-europe'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['capital-input-europe'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['capital-input-europe'].correct}/{highScores['capital-input-europe'].total}
              </span>
            )}
            Europas Hovedsteder
            <span className="block text-sm font-normal opacity-90">{getQuizCount('capital-input-europe')} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 10 min</span></span>
          </button>
          <button
            onClick={() => startQuiz('capital-choice-europe')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg text-lg shadow-lg relative"
          >
            {highScores['capital-choice-europe'] && (
              <span className={`absolute top-1 right-2 text-xs font-normal ${practiceMode ? 'line-through text-white/40' : highScores['capital-choice-europe'].percentage === 100 ? 'text-yellow-300' : 'text-white/70'}`}>
                ⭐ {highScores['capital-choice-europe'].correct}/{highScores['capital-choice-europe'].total}
              </span>
            )}
            Europas Hovedsteder (flervalg)
            <span className="block text-sm font-normal opacity-90">{getQuizCount('capital-choice-europe')} land<span className={practiceMode ? ' line-through opacity-50' : ''}> - 5 min</span></span>
          </button>
        </div>

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
    // Unreached = flags that were never shown to the user (not in seenFlags)
    const unreachedFlags = new Set(quizOrder.filter(f => !seenFlags.has(f)))

    // Wrong = failed + unreached (actually wrong/unanswered)
    const wrongFlags = quizOrder.filter(country => !correctFlags.has(country))
    // Practice = wrong + struggled (for learning)
    const practiceFlags = quizOrder.filter(country =>
      !correctFlags.has(country) || struggledFlags.has(country)
    )

    // Default tab: if got less than 30% right, show "all" to avoid cluttered wrong view
    const defaultTab: 'wrong' | 'practice' | 'all' = correctFlags.size < totalFlags * 0.3 ? 'all' : 'practice'
    // Use user selection if set, otherwise use computed default
    const activeTab = resultsTab ?? defaultTab

    // Select which flags to display based on active tab
    const displayFlags = activeTab === 'all' ? quizOrder
      : activeTab === 'wrong' ? wrongFlags
      : practiceFlags

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
            onClick={() => setResultsTab('wrong')}
            className={`px-4 py-2 rounded-l-lg ${activeTab === 'wrong' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Feil ({wrongFlags.length})
          </button>
          <button
            onClick={() => setResultsTab('practice')}
            className={`px-4 py-2 ${activeTab === 'practice' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Øve på ({practiceFlags.length})
          </button>
          <button
            onClick={() => setResultsTab('all')}
            className={`px-4 py-2 rounded-r-lg ${activeTab === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Alle ({totalFlags})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {displayFlags.map(country => {
              const isCorrect = correctFlags.has(country)
              const isStruggled = struggledFlags.has(country)
              const isUnreached = unreachedFlags.has(country)
              const attempts = struggledFlags.get(country)
              const flagUrl = currentFlags[country as keyof typeof currentFlags]
              const name = getQuizName(country)

              // Background and text color based on result
              let bgColor = 'bg-red-900/30'
              let textColor = 'text-red-400'
              if (isUnreached) {
                bgColor = 'bg-gray-800/50'
                textColor = 'text-gray-500'
              } else if (isCorrect && isStruggled) {
                bgColor = 'bg-yellow-900/30'
                textColor = 'text-yellow-400'
              } else if (isCorrect) {
                bgColor = 'bg-green-900/30'
                textColor = 'text-green-400'
              }

              // For capital quizzes, show the capital name with the country
              const capitalName = europeanCapitals[country]

              return (
                <div
                  key={country}
                  className={`flex flex-col items-center rounded-lg overflow-hidden ${bgColor}`}
                >
                  {isCapitalQuiz(quizType) ? (
                    // Capital quiz: show flag + country name + capital
                    <>
                      <div className="w-full aspect-[3/2] relative">
                        <img
                          src={flagUrl}
                          alt={name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-2 py-2 flex flex-col items-center">
                        <span className={`text-xs text-center ${textColor}`}>
                          {name}
                        </span>
                        <span className="text-xs text-gray-400 text-center">
                          {capitalName}
                        </span>
                        {isStruggled && attempts && (
                          <span className="text-xs text-gray-500 text-center mt-1">
                            Prøvde: {attempts.join(', ')}
                          </span>
                        )}
                      </div>
                    </>
                  ) : isMapQuiz(quizType) && !isKidsQuiz(quizType) ? (
                    // Map quiz: show map thumbnail
                    <>
                      <div className="w-full aspect-[3/2]">
                        <PrerenderedCountryMap highlightedCountry={country} width={128} height={85} mode="overview" />
                      </div>
                      <div className="px-2 py-2 flex flex-col items-center">
                        <span className={`text-xs text-center ${textColor}`}>
                          {name}
                        </span>
                        {isStruggled && attempts && (
                          <span className="text-xs text-gray-500 text-center mt-1">
                            Prøvde: {attempts.map(c => getQuizName(c)).join(', ')}
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    // Flag quiz: show flag
                    <>
                      <div className="w-full aspect-[3/2]">
                        <img
                          src={flagUrl}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-2 py-2 flex flex-col items-center">
                        <span className={`text-xs text-center ${textColor}`}>
                          {name}
                        </span>
                        {isStruggled && attempts && (
                          <span className="text-xs text-gray-500 text-center mt-1">
                            Prøvde: {attempts.map(c => getQuizName(c)).join(', ')}
                          </span>
                        )}
                      </div>
                    </>
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
  // Skipped this pass = flags we've passed in current queue that aren't correct yet
  const skippedThisPass = currentQueue.slice(0, currentIndex).filter(f => !correctFlags.has(f)).length
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
                // After seeing all, show total incorrect remaining (updates immediately on correct answer)
                (() => {
                  const totalIncorrect = quizOrder.filter(f => !correctFlags.has(f)).length
                  return (
                    <span className={totalIncorrect === 1 ? 'text-gray-400' : 'text-yellow-500'}>
                      {totalIncorrect === 1 ? 'Siste!' : `${totalIncorrect} hoppet over`}
                    </span>
                  )
                })()
              ) : (
                <>
                  <span className="text-gray-400">{remainingText}</span>
                  {skippedThisPass > 0 && (
                    <span className="text-yellow-500">{skippedThisPass} hoppet over</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {isCapitalInputQuiz(quizType) ? (
          /* Capital input quiz: Map with flag overlay + country name as question */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4">
            <div className="relative aspect-video mb-3">
              <CountryMap highlightedCountry={currentCountry} width={512} height={288} allowZoomToggle={practiceMode} onMapClick={() => inputRef.current?.focus()} capitalCoords={capitalCoordinates[currentCountry]} />
              <div className="absolute top-2 right-2 w-16 sm:w-20 rounded-md overflow-hidden shadow-lg bg-gray-800">
                <img
                  src={flagUrl}
                  alt="Flagg"
                  className="w-full object-contain"
                />
              </div>
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold text-center">{correctAnswer}</p>
            <p className="text-gray-400 text-sm text-center mt-1">Hva er hovedstaden?</p>
          </div>
        ) : isCapitalChoiceQuiz(quizType) ? (
          /* Capital choice quiz: Capital name as question */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mt-8 sm:mt-12 mb-10 sm:mb-14 text-center">
            <p className="text-gray-400 text-sm mb-2">Hvilket land har denne hovedstaden?</p>
            <p className="text-white text-3xl sm:text-4xl font-bold">{correctCapital}</p>
          </div>
        ) : isKidsMapQuiz(quizType) ? (
          /* Kids map quiz: Map + country name as question */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-10 sm:mb-14">
            <div className="aspect-video mb-2">
              <CountryMap highlightedCountry={currentCountry} width={512} height={288} />
            </div>
            <p className="text-white text-xl sm:text-2xl font-bold text-center">{correctAnswer}</p>
          </div>
        ) : isMapQuiz(quizType) ? (
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg aspect-video mb-2 sm:mb-4">
            <CountryMap highlightedCountry={currentCountry} width={512} height={288} allowZoomToggle={practiceMode} onMapClick={() => inputRef.current?.focus()} />
          </div>
        ) : (
          <img
            src={flagUrl}
            alt="Flagg"
            className={`w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg h-36 sm:h-48 lg:h-72 object-contain ${isKidsFlagQuiz(quizType) ? 'mb-10 sm:mb-14' : 'mb-2 sm:mb-4'}`}
          />
        )}

        {isCapitalInputQuiz(quizType) ? (
          /* Capital input quiz: Text input for capital name */
          <>
            <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4">
              <input
                ref={inputRef}
                type="text"
                value={justAnswered ? correctCapital : input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Skriv hovedstadens navn..."
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
          </>
        ) : isCapitalChoiceQuiz(quizType) ? (
          /* Capital choice quiz: Mixed options (2x2 grid with name/flag/map) */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4 grid grid-cols-2 gap-3">
            {currentOptions.filter(opt => opt in countryFlags).map((option, idx) => {
              const choiceType = capitalChoiceTypes[idx] || 'name'
              const optionFlagUrl = countryFlags[option as keyof typeof countryFlags]
              const optionName = norwegianNames[option] || option
              const isSelected = selectedOption === option
              const isCorrectOption = option === currentCountry
              const wasWrongAnswer = justAnswered && selectedOption && selectedOption !== currentCountry

              let borderClass = ''
              if (justAnswered) {
                if (isSelected && isCorrectOption) {
                  borderClass = 'ring-4 ring-green-400'
                } else if (isSelected && !isCorrectOption) {
                  borderClass = 'ring-4 ring-red-400'
                } else if (wasWrongAnswer && isCorrectOption) {
                  borderClass = 'ring-4 ring-green-400'
                }
              }

              // All button types share same aspect ratio and size
              const buttonClass = `${borderClass} rounded-xl overflow-hidden transition-colors duration-150 aspect-[3/2]`

              // Render different content based on choice type
              if (choiceType === 'flag') {
                return (
                  <button
                    key={option}
                    onClick={() => handleCapitalChoiceClick(option)}
                    disabled={justAnswered}
                    className={buttonClass}
                  >
                    <img
                      src={optionFlagUrl}
                      alt="Flagg"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )
              } else if (choiceType === 'map') {
                return (
                  <button
                    key={option}
                    onClick={() => handleCapitalChoiceClick(option)}
                    disabled={justAnswered}
                    className={buttonClass}
                  >
                    <PrerenderedCountryMap highlightedCountry={option} width={200} height={133} mode="overview" />
                  </button>
                )
              } else {
                // 'name'
                return (
                  <button
                    key={option}
                    onClick={() => handleCapitalChoiceClick(option)}
                    disabled={justAnswered}
                    className={`${buttonClass} bg-gray-800 hover:bg-gray-700 flex items-center justify-center`}
                  >
                    <span className="text-white font-bold text-lg">{optionName}</span>
                  </button>
                )
              }
            })}
          </div>
        ) : isKidsMapQuiz(quizType) ? (
          /* Kids map quiz: Flag options (2x2 grid) */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4 grid grid-cols-2 gap-3">
            {currentOptions.filter(opt => opt in countryFlags).map((option) => {
              const optionFlagUrl = countryFlags[option as keyof typeof countryFlags]
              const isSelected = selectedOption === option
              const isCorrectOption = option === currentCountry
              const wasWrongAnswer = justAnswered && selectedOption && selectedOption !== currentCountry

              let borderClass = ''
              if (justAnswered) {
                if (isSelected && isCorrectOption) {
                  borderClass = 'ring-4 ring-green-400'
                } else if (isSelected && !isCorrectOption) {
                  borderClass = 'ring-4 ring-red-400'
                } else if (wasWrongAnswer && isCorrectOption) {
                  borderClass = 'ring-4 ring-green-400'
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleKidsOptionClick(option)}
                  disabled={justAnswered}
                  className={`${borderClass} rounded-xl overflow-hidden transition-colors duration-150 h-32 sm:h-36`}
                >
                  <img
                    src={optionFlagUrl}
                    alt="Flagg"
                    className="w-full h-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        ) : isKidsFlagQuiz(quizType) ? (
          /* Kids flag quiz: Text buttons */
          <div className="w-full max-w-[95vw] sm:max-w-sm lg:max-w-lg mb-2 sm:mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentOptions.filter(opt => opt in countryFlags && opt in norwegianNames).map((option) => {
              const optionName = norwegianNames[option]
              const isSelected = selectedOption === option
              const isCorrectOption = option === currentCountry
              const wasWrongAnswer = justAnswered && selectedOption && selectedOption !== currentCountry

              let buttonClass = 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
              if (justAnswered) {
                if (isSelected && isCorrectOption) {
                  // Selected the correct answer
                  buttonClass = 'bg-green-600 border-2 border-green-400'
                } else if (isSelected && !isCorrectOption) {
                  // Selected wrong answer - show red
                  buttonClass = 'bg-red-600 border-2 border-red-400'
                } else if (wasWrongAnswer && isCorrectOption) {
                  // Show correct answer in green when wrong was selected
                  buttonClass = 'bg-green-600 border-2 border-green-400'
                }
              }

              return (
                <button
                  key={option}
                  onClick={() => handleKidsOptionClick(option)}
                  disabled={justAnswered}
                  className={`${buttonClass} text-white font-bold py-4 px-4 rounded-xl text-lg transition-colors duration-150`}
                >
                  {optionName}
                </button>
              )
            })}
          </div>
        ) : (
          /* Normal mode: Text input */
          <>
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
          </>
        )}

        <div className="flex gap-4">
          <button
            onClick={goToStartScreen}
            className="text-gray-500 hover:text-gray-400 text-xs sm:text-sm underline"
          >
            Alle quizer
          </button>
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
