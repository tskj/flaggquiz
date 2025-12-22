import { useState, useEffect, useRef } from 'react'
import countryFlags from '../country-flags.json'
import { isCloseEnough } from './fuzzyMatch'

const norwegianNames: Record<string, string> = {
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
  "Palestine": "Palestina",
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
  "Kosovo": "Kosovo",
  "Taiwan": "Taiwan"
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function App() {
  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)
  const [currentQueue, setCurrentQueue] = useState<string[]>([])
  const [skippedFlags, setSkippedFlags] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [timeRemaining, setTimeRemaining] = useState(15 * 60)
  const [completedCount, setCompletedCount] = useState(0)
  const [round, setRound] = useState(1)
  const [justAnswered, setJustAnswered] = useState(false)
  const [quizOrder, setQuizOrder] = useState<string[]>([])
  const [correctFlags, setCorrectFlags] = useState<Set<string>>(new Set())
  const [showAllResults, setShowAllResults] = useState(false)
  const [struggledFlags, setStruggledFlags] = useState<Map<string, string[]>>(new Map())
  const [currentAttempts, setCurrentAttempts] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const totalFlags = Object.keys(countryFlags).length

  useEffect(() => {
    if (!quizStarted || quizFinished) return

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
  }, [quizStarted, quizFinished])

  useEffect(() => {
    if (quizStarted && !quizFinished && inputRef.current) {
      inputRef.current.focus()
    }
  }, [quizStarted, quizFinished, currentIndex, round])


  const startQuiz = () => {
    const allCountries = Object.keys(countryFlags)
    const shuffled = shuffleArray(allCountries)
    setCurrentQueue(shuffled)
    setQuizOrder(shuffled)
    setSkippedFlags([])
    setCurrentIndex(0)
    setCompletedCount(0)
    setTimeRemaining(15 * 60)
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
  const correctAnswer = norwegianNames[currentCountry] || currentCountry

  const checkAnswer = (value: string) => {
    if (justAnswered) return
    if (isCloseEnough(value, correctAnswer)) {
      setJustAnswered(true)
      setCompletedCount(prev => prev + 1)
      setCorrectFlags(prev => new Set(prev).add(currentCountry))
      // If we had attempts before getting it right, mark as struggled
      if (currentAttempts.length > 0) {
        setStruggledFlags(prev => new Map(prev).set(currentCountry, [...currentAttempts]))
      }
      setCurrentAttempts([])
      setTimeout(() => {
        setJustAnswered(false)
        moveToNext(false)
      }, 400)
    } else {
      // Check if input matches any other country (close enough guess at wrong country)
      const normalizedInput = value.toLowerCase().trim()
      if (normalizedInput.length >= 3) {
        for (const country of Object.keys(countryFlags)) {
          if (country === currentCountry) continue
          const countryName = norwegianNames[country] || country
          if (isCloseEnough(value, countryName)) {
            // Found a close match with a different country - track as attempt
            if (!currentAttempts.includes(country)) {
              setCurrentAttempts(prev => [...prev, country])
            }
            break
          }
        }
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (justAnswered) return
    const value = e.target.value
    setInput(value)
    checkAnswer(value)
  }

  const skipFlag = () => {
    moveToNext(true)
  }

  const giveUp = () => {
    setQuizFinished(true)
  }

  const moveToNext = (wasSkipped: boolean) => {
    const newSkipped = wasSkipped
      ? [...skippedFlags, currentCountry]
      : skippedFlags

    if (currentIndex + 1 < currentQueue.length) {
      setCurrentIndex(currentIndex + 1)
      if (wasSkipped) setSkippedFlags(newSkipped)
    } else if (newSkipped.length > 0) {
      setCurrentQueue(shuffleArray(newSkipped))
      setSkippedFlags([])
      setCurrentIndex(0)
      setRound(prev => prev + 1)
    } else {
      setQuizFinished(true)
    }
    setInput('')
    setCurrentAttempts([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      skipFlag()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-white text-3xl font-bold mb-8 text-center">Flaggquiz</h1>
        <p className="text-gray-400 mb-8 text-center">
          Gjett det norske navnet på {totalFlags} land
        </p>
        <button
          onClick={startQuiz}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
        >
          Start quiz
        </button>
      </div>
    )
  }

  if (quizFinished) {
    const failedFlags = quizOrder.filter(country => !correctFlags.has(country))
    const struggledList = Array.from(struggledFlags.keys())
    // For the "Feil/Struggled" view, show both failed and struggled flags
    const problemFlags = [...failedFlags, ...struggledList.filter(c => !failedFlags.includes(c))]
    const displayFlags = showAllResults ? quizOrder : problemFlags

    return (
      <div className="min-h-screen bg-black flex flex-col p-4">
        <div className="text-center mb-6">
          <h1 className="text-white text-3xl font-bold mb-2">
            {completedCount === totalFlags ? 'Gratulerer!' : 'Tiden er ute!'}
          </h1>
          <p className="text-gray-400 text-xl mb-4">
            Du klarte {completedCount} av {totalFlags} flagg
          </p>
          <button
            onClick={startQuiz}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Prøv igjen
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <button
            onClick={() => setShowAllResults(false)}
            className={`px-4 py-2 rounded-l-lg ${!showAllResults ? 'bg-gray-700 text-white' : 'bg-gray-900 text-gray-400'}`}
          >
            Feil ({failedFlags.length}){struggledList.length > 0 && ` + ${struggledList.length} slitt`}
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
              const flagUrl = countryFlags[country as keyof typeof countryFlags]
              const name = norwegianNames[country] || country

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
                      Prøvde: {attempts.map(c => norwegianNames[c] || c).join(', ')}
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

  const flagUrl = countryFlags[currentCountry as keyof typeof countryFlags]
  const remainingInRound = currentQueue.length - currentIndex - 1
  const skippedCount = skippedFlags.length

  return (
    <div className="min-h-screen bg-black flex flex-col p-4">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm mb-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-white text-xl font-mono">{formatTime(timeRemaining)}</span>
            <span className="text-green-500 text-lg font-bold">{completedCount} riktige</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">Runde {round}</span>
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

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Skriv landets navn..."
          className={`w-full max-w-sm text-white rounded-lg px-4 py-3 text-lg mb-4 focus:outline-none transition-colors duration-150 ${
            justAnswered
              ? 'bg-green-600 border-green-500 border-2'
              : 'bg-gray-900 border border-gray-700 focus:border-blue-500'
          }`}
          autoComplete="off"
          autoCapitalize="off"
        />

        <button
          onClick={skipFlag}
          className="w-full max-w-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg mb-3"
        >
          Hopp over <span className="text-gray-400 text-sm">(Tab)</span>
        </button>

        <button
          onClick={giveUp}
          className="text-gray-500 hover:text-gray-400 text-sm underline"
        >
          Gi opp
        </button>
      </div>
    </div>
  )
}
