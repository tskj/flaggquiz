// European country capitals in Norwegian
// Maps country name (English) to capital name (Norwegian)

export const europeanCapitals: Record<string, string> = {
  'Albania': 'Tirana',
  'Andorra': 'Andorra la Vella',
  'Austria': 'Wien',
  'Belarus': 'Minsk',
  'Belgium': 'Brussel',
  'Bosnia and Herzegovina': 'Sarajevo',
  'Bulgaria': 'Sofia',
  'Croatia': 'Zagreb',
  'Cyprus': 'Nikosia',
  'Czech Republic': 'Praha',
  'Denmark': 'København',
  'Estonia': 'Tallinn',
  'Finland': 'Helsinki',
  'France': 'Paris',
  'Germany': 'Berlin',
  'Greece': 'Athen',
  'Hungary': 'Budapest',
  'Iceland': 'Reykjavik',
  'Ireland': 'Dublin',
  'Italy': 'Roma',
  'Kosovo': 'Pristina',
  'Latvia': 'Riga',
  'Liechtenstein': 'Vaduz',
  'Lithuania': 'Vilnius',
  'Luxembourg': 'Luxembourg',
  'Malta': 'Valletta',
  'Moldova': 'Chisinau',
  'Monaco': 'Monaco',
  'Montenegro': 'Podgorica',
  'Netherlands': 'Amsterdam',
  'North Macedonia': 'Skopje',
  'Norway': 'Oslo',
  'Poland': 'Warszawa',
  'Portugal': 'Lisboa',
  'Romania': 'Bucuresti',
  'Russia': 'Moskva',
  'San Marino': 'San Marino',
  'Serbia': 'Beograd',
  'Slovakia': 'Bratislava',
  'Slovenia': 'Ljubljana',
  'Spain': 'Madrid',
  'Sweden': 'Stockholm',
  'Switzerland': 'Bern',
  'Ukraine': 'Kyiv',
  'United Kingdom': 'London',
  'Vatican City': 'Vatikanstaten',
}

// Alternative spellings for capitals that should also be accepted
export const capitalAlternatives: Record<string, string[]> = {
  'Wien': ['Vienna'],
  'Brussel': ['Brussels', 'Bruxelles'],
  'Praha': ['Prag', 'Prague'],
  'København': ['Copenhagen', 'Koebenhavn', 'Kobenhavn'],
  'Athen': ['Athens', 'Athena'],
  'Roma': ['Rome'],
  'Nikosia': ['Nicosia', 'Lefkosia'],
  'Warszawa': ['Warsaw', 'Warsawa'],
  'Lisboa': ['Lisbon', 'Lissabon'],
  'Bucuresti': ['Bucharest', 'Bukarest'],
  'Moskva': ['Moscow', 'Moscu'],
  'Beograd': ['Belgrade', 'Belgrad'],
  'Kyiv': ['Kiev'],
  'Chisinau': ['Kishinev', 'Chisinău'],
  'Vatikanstaten': ['Vatican City', 'Vatikanet'],
}

// Get capital for a country
export function getCapital(country: string): string | undefined {
  return europeanCapitals[country]
}

// Get alternative names for a capital
export function getCapitalAlternatives(capital: string): string[] {
  return capitalAlternatives[capital] || []
}
