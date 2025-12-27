// Kids quiz: Multiple choice alternatives for European countries
// Each country has multiple sets of distractors to vary the quiz
// Distractors are chosen to be visually distinct from the correct answer

// Groups of similar flags to avoid putting together:
// - Nordic crosses: Norway, Sweden, Finland, Denmark, Iceland
// - Red/white horizontal: Monaco, Poland, Indonesia (non-EU)
// - Tricolors vertical: France, Italy, Ireland, Belgium, Romania
// - Tricolors horizontal: Russia, Netherlands, Luxembourg, Germany, Hungary
// - Similar patterns: Slovakia/Slovenia, Austria/Latvia, Serbia/Russia

type DistractorSets = string[][]  // Each inner array is a set of 3 wrong answers

export const kidsQuizDistractors: Record<string, DistractorSets> = {
  'Albania': [
    ['Greece', 'Portugal', 'Belgium'],
    ['Spain', 'Germany', 'France'],
    ['Italy', 'United Kingdom', 'Netherlands'],
  ],
  'Andorra': [
    ['Spain', 'Germany', 'Greece'],
    ['Portugal', 'Italy', 'Belgium'],
    ['France', 'Netherlands', 'United Kingdom'],
  ],
  'Austria': [
    ['Germany', 'Belgium', 'France'],
    ['Netherlands', 'Italy', 'Spain'],
    ['Portugal', 'Greece', 'United Kingdom'],
  ],
  'Belarus': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Belgium': [
    ['France', 'Netherlands', 'Spain'],
    ['Italy', 'Portugal', 'United Kingdom'],
    ['Greece', 'Austria', 'Switzerland'],
  ],
  'Bosnia and Herzegovina': [
    ['Greece', 'Spain', 'Italy'],
    ['France', 'Germany', 'Portugal'],
    ['Netherlands', 'Belgium', 'United Kingdom'],
  ],
  'Bulgaria': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Austria', 'United Kingdom'],
  ],
  'Croatia': [
    ['France', 'Germany', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Cyprus': [
    ['Greece', 'Spain', 'Italy'],
    ['France', 'Germany', 'Portugal'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Czech Republic': [
    ['France', 'Germany', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Denmark': [
    ['Germany', 'France', 'Spain'],  // Avoid other Nordic
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Estonia': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'United Kingdom', 'Austria'],
  ],
  'Finland': [
    ['Germany', 'France', 'Spain'],  // Avoid other Nordic
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'France': [
    ['Germany', 'Spain', 'Portugal'],
    ['Greece', 'Austria', 'United Kingdom'],
    ['Switzerland', 'Poland', 'Czech Republic'],
  ],
  'Germany': [
    ['France', 'Spain', 'Portugal'],
    ['Greece', 'Italy', 'United Kingdom'],
    ['Switzerland', 'Austria', 'Poland'],
  ],
  'Greece': [
    ['France', 'Germany', 'Spain'],
    ['Italy', 'Portugal', 'Austria'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Hungary': [
    ['France', 'Germany', 'Spain'],  // Avoid Italy (similar colors)
    ['Portugal', 'Greece', 'Austria'],
    ['Belgium', 'United Kingdom', 'Switzerland'],
  ],
  'Iceland': [
    ['Germany', 'France', 'Spain'],  // Avoid other Nordic
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Ireland': [
    ['Germany', 'Spain', 'Portugal'],  // Avoid Italy (similar pattern)
    ['Greece', 'Austria', 'United Kingdom'],
    ['Switzerland', 'Poland', 'Czech Republic'],
  ],
  'Italy': [
    ['Germany', 'Spain', 'Portugal'],  // Avoid Ireland, Hungary
    ['Greece', 'Austria', 'United Kingdom'],
    ['Switzerland', 'Poland', 'Czech Republic'],
  ],
  'Kosovo': [
    ['Greece', 'Spain', 'Italy'],
    ['France', 'Germany', 'Portugal'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Latvia': [
    ['Germany', 'France', 'Spain'],  // Avoid Austria (similar)
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Liechtenstein': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Lithuania': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Luxembourg': [
    ['Germany', 'France', 'Spain'],  // Avoid Netherlands (similar)
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Austria', 'United Kingdom'],
  ],
  'Malta': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Moldova': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Monaco': [
    ['Germany', 'France', 'Spain'],  // Avoid Poland, Indonesia
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Montenegro': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Netherlands': [
    ['Germany', 'France', 'Spain'],  // Avoid Luxembourg, Russia
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Austria', 'United Kingdom'],
  ],
  'North Macedonia': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Norway': [
    ['Germany', 'France', 'Spain'],  // Avoid other Nordic
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Poland': [
    ['Germany', 'France', 'Spain'],  // Avoid Monaco, Indonesia
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Portugal': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Greece', 'Austria'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Romania': [
    ['Germany', 'France', 'Spain'],  // Avoid Chad (identical)
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Russia': [
    ['Germany', 'France', 'Spain'],  // Avoid Netherlands, Luxembourg
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Austria', 'United Kingdom'],
  ],
  'San Marino': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Serbia': [
    ['Germany', 'France', 'Spain'],  // Avoid Russia (similar)
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Slovakia': [
    ['Germany', 'France', 'Spain'],  // Avoid Slovenia!
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Slovenia': [
    ['Germany', 'France', 'Spain'],  // Avoid Slovakia!
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Spain': [
    ['Germany', 'France', 'Portugal'],
    ['Italy', 'Greece', 'Austria'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Sweden': [
    ['Germany', 'France', 'Spain'],  // Avoid other Nordic
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Switzerland': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'Ukraine': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
  'United Kingdom': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'Austria'],
  ],
  'Vatican City': [
    ['Germany', 'France', 'Spain'],
    ['Italy', 'Portugal', 'Greece'],
    ['Belgium', 'Netherlands', 'United Kingdom'],
  ],
}

// Get random distractors for a country
export function getRandomDistractors(country: string): string[] {
  const sets = kidsQuizDistractors[country]
  if (!sets || sets.length === 0) {
    // Fallback: return some default countries
    return ['France', 'Germany', 'Spain'].filter(c => c !== country)
  }
  const randomIndex = Math.floor(Math.random() * sets.length)
  return sets[randomIndex]
}

// Shuffle array helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get 4 options (1 correct + 3 distractors) in random order
// For European countries, uses curated distractors; for others, picks randomly
export function getQuizOptions(correctCountry: string, allCountries?: string[]): string[] {
  let distractors: string[]

  if (allCountries) {
    // Random distractors from the provided country list
    distractors = getRandomDistractorsFromList(correctCountry, allCountries)
  } else {
    // Use curated European distractors
    distractors = getRandomDistractors(correctCountry)
  }

  const options = [correctCountry, ...distractors]
  return shuffleArray(options)
}

// Get random distractors from a list of countries
export function getRandomDistractorsFromList(correctCountry: string, allCountries: string[]): string[] {
  const available = allCountries.filter(c => c !== correctCountry)
  const shuffled = shuffleArray(available)
  return shuffled.slice(0, 3)
}
