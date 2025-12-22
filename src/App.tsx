import { useState, useEffect, useRef } from 'react'
import countryFlags from '../country-flags.json'

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

function normalizeAnswer(str: string): string {
  return str.toLowerCase().trim()
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
    setCurrentQueue(shuffleArray(allCountries))
    setSkippedFlags([])
    setCurrentIndex(0)
    setCompletedCount(0)
    setTimeRemaining(15 * 60)
    setRound(1)
    setQuizStarted(true)
    setQuizFinished(false)
    setInput('')
  }

  const currentCountry = currentQueue[currentIndex]
  const correctAnswer = norwegianNames[currentCountry] || currentCountry

  const checkAnswer = () => {
    if (normalizeAnswer(input) === normalizeAnswer(correctAnswer)) {
      setCompletedCount(prev => prev + 1)
      moveToNext(false)
    }
  }

  const skipFlag = () => {
    moveToNext(true)
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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkAnswer()
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
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-white text-3xl font-bold mb-4 text-center">
          {completedCount === totalFlags ? 'Gratulerer!' : 'Tiden er ute!'}
        </h1>
        <p className="text-gray-400 text-xl mb-8 text-center">
          Du klarte {completedCount} av {totalFlags} flagg
        </p>
        <button
          onClick={startQuiz}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl"
        >
          Prøv igjen
        </button>
      </div>
    )
  }

  const flagUrl = countryFlags[currentCountry as keyof typeof countryFlags]
  const remainingInRound = currentQueue.length - currentIndex
  const totalRemaining = remainingInRound + skippedFlags.length

  return (
    <div className="min-h-screen bg-black flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <span className="text-white text-lg font-mono">{formatTime(timeRemaining)}</span>
        <span className="text-gray-400">{completedCount} / {totalFlags}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-gray-500 text-sm mb-2">
          Runde {round} - {totalRemaining} gjenstår
        </div>

        <img
          src={flagUrl}
          alt="Flagg"
          className="w-full max-w-sm h-48 object-contain border border-gray-700 mb-6"
        />

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Skriv landets navn..."
          className="w-full max-w-sm bg-gray-900 text-white border border-gray-700 rounded-lg px-4 py-3 text-lg mb-4 focus:outline-none focus:border-blue-500"
          autoComplete="off"
          autoCapitalize="off"
        />

        <div className="flex gap-4 w-full max-w-sm">
          <button
            onClick={skipFlag}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            Hopp over
          </button>
          <button
            onClick={checkAnswer}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Svar
          </button>
        </div>
      </div>
    </div>
  )
}
