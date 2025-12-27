// Focal points for flags when cropping with object-cover
// Values are CSS object-position: [horizontal, vertical]
// Default is 'center center' if not specified

export const flagFocalPoints: Record<string, string> = {
  // Flags with left-aligned important elements
  'Belarus': 'left center',
  'Sri Lanka': 'right center',
  'Portugal': '35% center',
  'Spain': '35% center',

  // Flags with emblems slightly off-center
  'Kazakhstan': 'center center',
  'Turkmenistan': '35% center',
  'Uzbekistan': 'center 40%',

  // Nordic crosses (slightly left of center)
  'Norway': '40% center',
  'Sweden': '40% center',
  'Finland': '40% center',
  'Denmark': '40% center',
  'Iceland': '40% center',

  // Flags with canton (top-left quarter)
  'United States': 'left top',
  'Australia': 'left top',
  'New Zealand': 'left top',
  'Fiji': 'left top',
  'Tuvalu': 'left top',
  'Malaysia': 'left top',
  'Liberia': 'left top',
  'Chile': 'left top',
  'Uruguay': 'left top',
  'Greece': 'left top',
  'Tonga': 'left top',
  'Samoa': 'left top',
  'Taiwan': 'left top',

  // UK and related
  'United Kingdom': 'center center',

  // Flags with important left-side elements
  'Bhutan': 'center center',
  'Ecuador': 'center 40%',
  'Colombia': 'center 35%',
  'Venezuela': 'center center',

  // Flags with seals/emblems
  'Mexico': 'center center',
  'Guatemala': 'center center',
  'El Salvador': 'center center',
  'Nicaragua': 'center center',
  'Costa Rica': 'center center',
  'Paraguay': 'center center',
  'Argentina': 'center center',
  'Brazil': 'center center',
}

// Get the focal point for a country's flag
export function getFlagFocalPoint(country: string): string {
  return flagFocalPoints[country] || 'center center'
}
