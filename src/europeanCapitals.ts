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

// Capital coordinates [longitude, latitude]
export const capitalCoordinates: Record<string, [number, number]> = {
  'Albania': [19.8189, 41.3275],        // Tirana
  'Andorra': [1.5218, 42.5063],         // Andorra la Vella
  'Austria': [16.3738, 48.2082],        // Wien
  'Belarus': [27.5667, 53.9000],        // Minsk
  'Belgium': [4.3517, 50.8503],         // Brussel
  'Bosnia and Herzegovina': [18.4131, 43.8563], // Sarajevo
  'Bulgaria': [23.3219, 42.6977],       // Sofia
  'Croatia': [15.9819, 45.8150],        // Zagreb
  'Cyprus': [33.3823, 35.1856],         // Nikosia
  'Czech Republic': [14.4378, 50.0755], // Praha
  'Denmark': [12.5683, 55.6761],        // København
  'Estonia': [24.7536, 59.4370],        // Tallinn
  'Finland': [24.9384, 60.1699],        // Helsinki
  'France': [2.3522, 48.8566],          // Paris
  'Germany': [13.4050, 52.5200],        // Berlin
  'Greece': [23.7275, 37.9838],         // Athen
  'Hungary': [19.0402, 47.4979],        // Budapest
  'Iceland': [-21.8174, 64.1466],       // Reykjavik
  'Ireland': [-6.2603, 53.3498],        // Dublin
  'Italy': [12.4964, 41.9028],          // Roma
  'Kosovo': [21.1655, 42.6629],         // Pristina
  'Latvia': [24.1052, 56.9496],         // Riga
  'Liechtenstein': [9.5209, 47.1410],   // Vaduz
  'Lithuania': [25.2797, 54.6872],      // Vilnius
  'Luxembourg': [6.1296, 49.6116],      // Luxembourg
  'Malta': [14.5146, 35.8989],          // Valletta
  'Moldova': [28.8638, 47.0105],        // Chisinau
  'Monaco': [7.4246, 43.7384],          // Monaco
  'Montenegro': [19.2636, 42.4304],     // Podgorica
  'Netherlands': [4.9041, 52.3676],     // Amsterdam
  'North Macedonia': [21.4314, 41.9981], // Skopje
  'Norway': [10.7522, 59.9139],         // Oslo
  'Poland': [21.0122, 52.2297],         // Warszawa
  'Portugal': [-9.1393, 38.7223],       // Lisboa
  'Romania': [26.1025, 44.4268],        // Bucuresti
  'Russia': [37.6173, 55.7558],         // Moskva
  'San Marino': [12.4578, 43.9424],     // San Marino
  'Serbia': [20.4489, 44.7866],         // Beograd
  'Slovakia': [17.1077, 48.1486],       // Bratislava
  'Slovenia': [14.5058, 46.0569],       // Ljubljana
  'Spain': [-3.7038, 40.4168],          // Madrid
  'Sweden': [18.0686, 59.3293],         // Stockholm
  'Switzerland': [7.4474, 46.9480],     // Bern
  'Ukraine': [30.5234, 50.4501],        // Kyiv
  'United Kingdom': [-0.1276, 51.5074], // London
  'Vatican City': [12.4534, 41.9029],   // Vatikanstaten
}

// Get capital for a country
export function getCapital(country: string): string | undefined {
  return europeanCapitals[country]
}

// Get alternative names for a capital
export function getCapitalAlternatives(capital: string): string[] {
  return capitalAlternatives[capital] || []
}
