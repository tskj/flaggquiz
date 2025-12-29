// Seas and oceans with their center coordinates for quiz display
export interface SeaData {
  name: string
  norwegianName: string
  center: [number, number] // [longitude, latitude]
  zoom: number // relative zoom level (1 = normal, higher = more zoomed in)
}

export const seas: SeaData[] = [
  // Major Oceans
  { name: 'Pacific Ocean', norwegianName: 'Stillehavet', center: [-160, 0], zoom: 0.5 },
  { name: 'Atlantic Ocean', norwegianName: 'Atlanterhavet', center: [-30, 0], zoom: 0.5 },
  { name: 'Indian Ocean', norwegianName: 'Indiahavet', center: [75, -20], zoom: 0.6 },
  { name: 'Arctic Ocean', norwegianName: 'Nordishavet', center: [0, 85], zoom: 0.8 },
  { name: 'Southern Ocean', norwegianName: 'Sydishavet', center: [0, -65], zoom: 0.6 },

  // European Seas
  { name: 'Mediterranean Sea', norwegianName: 'Middelhavet', center: [18, 35], zoom: 1.5 },
  { name: 'North Sea', norwegianName: 'Nordsjøen', center: [3, 56], zoom: 2.5 },
  { name: 'Baltic Sea', norwegianName: 'Østersjøen', center: [20, 58], zoom: 2.5 },
  { name: 'Black Sea', norwegianName: 'Svartehavet', center: [34, 43], zoom: 2.5 },
  { name: 'Caspian Sea', norwegianName: 'Det kaspiske hav', center: [51, 42], zoom: 2.5 },
  { name: 'Adriatic Sea', norwegianName: 'Adriaterhavet', center: [16, 43], zoom: 3 },
  { name: 'Aegean Sea', norwegianName: 'Egeerhavet', center: [25, 38], zoom: 3 },
  { name: 'Barents Sea', norwegianName: 'Barentshavet', center: [40, 75], zoom: 2 },
  { name: 'Norwegian Sea', norwegianName: 'Norskehavet', center: [5, 68], zoom: 2 },

  // American Seas
  { name: 'Caribbean Sea', norwegianName: 'Karibiske hav', center: [-75, 15], zoom: 2 },
  { name: 'Gulf of Mexico', norwegianName: 'Mexicogolfen', center: [-90, 25], zoom: 2 },
  { name: 'Hudson Bay', norwegianName: 'Hudsonbukta', center: [-85, 60], zoom: 2 },
  { name: 'Gulf of California', norwegianName: 'Californiabukta', center: [-110, 28], zoom: 2.5 },

  // Asian Seas
  { name: 'South China Sea', norwegianName: 'Sørkinahavet', center: [115, 12], zoom: 2 },
  { name: 'East China Sea', norwegianName: 'Østkinahavet', center: [125, 28], zoom: 2.5 },
  { name: 'Sea of Japan', norwegianName: 'Japanhavet', center: [135, 40], zoom: 2.5 },
  { name: 'Bay of Bengal', norwegianName: 'Bengalbukta', center: [88, 15], zoom: 2 },
  { name: 'Arabian Sea', norwegianName: 'Arabiahavet', center: [65, 15], zoom: 2 },
  { name: 'Red Sea', norwegianName: 'Rødehavet', center: [38, 20], zoom: 2.5 },
  { name: 'Persian Gulf', norwegianName: 'Persiabukta', center: [51, 27], zoom: 3 },
  { name: 'Sea of Okhotsk', norwegianName: 'Okhotskhavet', center: [150, 55], zoom: 2 },
  { name: 'Bering Sea', norwegianName: 'Beringhavet', center: [-175, 58], zoom: 2 },
  { name: 'Yellow Sea', norwegianName: 'Gulehavet', center: [123, 36], zoom: 2.5 },
  { name: 'Philippine Sea', norwegianName: 'Filippinerhavet', center: [135, 20], zoom: 1.5 },

  // African/Oceanian Seas
  { name: 'Coral Sea', norwegianName: 'Korallhavet', center: [155, -18], zoom: 2 },
  { name: 'Tasman Sea', norwegianName: 'Tasmanhavet', center: [160, -38], zoom: 2 },
  { name: 'Gulf of Aden', norwegianName: 'Adenbukta', center: [48, 12], zoom: 3 },
  { name: 'Mozambique Channel', norwegianName: 'Mosambikkanalen', center: [42, -18], zoom: 2.5 },
]

// Alternative names for fuzzy matching
export const seaAlternativeNames: Record<string, string[]> = {
  'Stillehavet': ['Stille havet', 'Pasifik'],
  'Atlanterhavet': ['Atlanteren'],
  'Indiahavet': ['Det indiske hav', 'Indiske hav'],
  'Nordishavet': ['Arktiske hav', 'Ishavet'],
  'Sydishavet': ['Antarktiske hav', 'Sørishavet'],
  'Middelhavet': ['Middelhavs'],
  'Nordsjøen': ['Nordsjø'],
  'Østersjøen': ['Baltiske hav', 'Baltikum'],
  'Svartehavet': ['Svarte havet'],
  'Det kaspiske hav': ['Kaspihavet', 'Kaspiske hav'],
  'Karibiske hav': ['Karibia', 'Karibien'],
  'Mexicogolfen': ['Golfområdet'],
  'Japanhavet': ['Øst-havet'],
  'Rødehavet': ['Røde havet'],
  'Persiabukta': ['Persiagulfen', 'Den persiske gulf'],
}

// Get quiz options (4 options including correct answer)
export function getSeaQuizOptions(correctSea: SeaData, allSeas: SeaData[]): string[] {
  const options = [correctSea.norwegianName]
  const otherSeas = allSeas.filter(s => s.name !== correctSea.name)

  // Shuffle and pick 3 random distractors
  const shuffled = [...otherSeas].sort(() => Math.random() - 0.5)
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    options.push(shuffled[i].norwegianName)
  }

  // Shuffle the final options
  return options.sort(() => Math.random() - 0.5)
}
