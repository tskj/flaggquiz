import { describe, it, expect } from 'vitest'
import { fuzzyMatch, isCloseEnough, isAmbiguous } from './fuzzyMatch'

describe('fuzzyMatch', () => {
  it('returns 0 for exact matches', () => {
    expect(fuzzyMatch('norge', 'norge')).toBe(0)
    expect(fuzzyMatch('storbritannia', 'storbritannia')).toBe(0)
  })

  it('returns low distance for missing letter', () => {
    expect(fuzzyMatch('storbritania', 'storbritannia')).toBeLessThanOrEqual(5)
  })

  it('returns high distance for completely wrong answers', () => {
    expect(fuzzyMatch('sverige', 'norge')).toBeGreaterThan(5)
    expect(fuzzyMatch('abc', 'storbritannia')).toBeGreaterThan(10)
  })
})

describe('isCloseEnough', () => {
  describe('should accept', () => {
    it('exact matches', () => {
      expect(isCloseEnough('Norge', 'Norge')).toBe(true)
      expect(isCloseEnough('Storbritannia', 'Storbritannia')).toBe(true)
    })

    it('case insensitive matches', () => {
      expect(isCloseEnough('norge', 'Norge')).toBe(true)
      expect(isCloseEnough('STORBRITANNIA', 'Storbritannia')).toBe(true)
    })

    it('missing single letter in longer words', () => {
      expect(isCloseEnough('storbritania', 'Storbritannia')).toBe(true)
      expect(isCloseEnough('Tysklnd', 'Tyskland')).toBe(true)
    })

    it('double letters typed as single', () => {
      expect(isCloseEnough('Marokko', 'Marokko')).toBe(true)
      expect(isCloseEnough('Maroko', 'Marokko')).toBe(true)
    })

    it('longer country names with typos', () => {
      expect(isCloseEnough('Den sentralafrikanske repubikk', 'Den sentralafrikanske republikk')).toBe(true)
      expect(isCloseEnough('De forente arabiske emirater', 'De forente arabiske emirater')).toBe(true)
    })

    it('spaces and hyphens are optional', () => {
      expect(isCloseEnough('sørkorea', 'Sør-Korea')).toBe(true)
      expect(isCloseEnough('saudiarabia', 'Saudi-Arabia')).toBe(true)
      expect(isCloseEnough('nordkorea', 'Nord-Korea')).toBe(true)
      expect(isCloseEnough('srilanka', 'Sri Lanka')).toBe(true)
      expect(isCloseEnough('newzealand', 'New Zealand')).toBe(true)
      expect(isCloseEnough('densentralafrikanskerepublikk', 'Den sentralafrikanske republikk')).toBe(true)
      expect(isCloseEnough('deforentearabiskeemirater', 'De forente arabiske emirater')).toBe(true)
    })
  })

  describe('should reject', () => {
    it('completely wrong answers', () => {
      expect(isCloseEnough('Sverige', 'Norge')).toBe(false)
      expect(isCloseEnough('Finland', 'Tyskland')).toBe(false)
    })

    it('random gibberish', () => {
      expect(isCloseEnough('asdf', 'Norge')).toBe(false)
      expect(isCloseEnough('xyz', 'Storbritannia')).toBe(false)
    })

    it('empty input', () => {
      expect(isCloseEnough('', 'Norge')).toBe(false)
    })

    it('very short partial matches', () => {
      expect(isCloseEnough('No', 'Norge')).toBe(false)
      expect(isCloseEnough('St', 'Storbritannia')).toBe(false)
      expect(isCloseEnough('in', 'India')).toBe(false)
      expect(isCloseEnough('dan', 'Danmark')).toBe(false)
      expect(isCloseEnough('para', 'Paraguay')).toBe(false)
      expect(isCloseEnough('P', 'Peru')).toBe(false)
    })
  })
})

describe('isAmbiguous', () => {
  // Realistic set of Norwegian country names that could be confused
  const allCountries = [
    'Mauritius', 'Mauritania', 'Mali', 'Malawi', 'Malaysia',
    'Niger', 'Nigeria', 'Norge',
    'Guinea', 'Guinea-Bissau', 'Ekvatorial-Guinea',
    'India', 'Indonesia',
    'Iran', 'Irak', 'Irland',
    'Slovenia', 'Slovakia',
    'Sudan', 'Sør-Sudan',
    'Nord-Korea', 'Sør-Korea',
    'Dominica', 'Den dominikanske republikk',
    'Republikken Kongo', 'Den demokratiske republikken Kongo',
    'Australia', 'Østerrike'
  ]

  describe('Mauritius vs Mauritania', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('mauritius', 'Mauritius', allCountries)).toBe(false)
      expect(isAmbiguous('mauritania', 'Mauritania', allCountries)).toBe(false)
    })

    it('partial "maurit" is ambiguous', () => {
      expect(isAmbiguous('maurit', 'Mauritius', allCountries)).toBe(true)
      expect(isAmbiguous('maurit', 'Mauritania', allCountries)).toBe(true)
    })

    it('typing more disambiguates', () => {
      expect(isAmbiguous('mauriti', 'Mauritius', allCountries)).toBe(false) // only matches Mauritius
      expect(isAmbiguous('maurita', 'Mauritania', allCountries)).toBe(false) // only matches Mauritania
    })
  })

  describe('Niger vs Nigeria', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('niger', 'Niger', allCountries)).toBe(false)
      expect(isAmbiguous('nigeria', 'Nigeria', allCountries)).toBe(false)
    })

    it('nigeri is ambiguous (close to both)', () => {
      expect(isAmbiguous('nigeri', 'Nigeria', allCountries)).toBe(true)
    })
  })

  describe('Mali vs Malawi vs Malaysia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('mali', 'Mali', allCountries)).toBe(false)
      expect(isAmbiguous('malawi', 'Malawi', allCountries)).toBe(false)
      expect(isAmbiguous('malaysia', 'Malaysia', allCountries)).toBe(false)
    })
  })

  describe('Iran vs Irak vs Irland', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('iran', 'Iran', allCountries)).toBe(false)
      expect(isAmbiguous('irak', 'Irak', allCountries)).toBe(false)
      expect(isAmbiguous('irland', 'Irland', allCountries)).toBe(false)
    })

    it('ira is ambiguous', () => {
      expect(isAmbiguous('ira', 'Iran', allCountries)).toBe(true)
      expect(isAmbiguous('ira', 'Irak', allCountries)).toBe(true)
    })
  })

  describe('Slovenia vs Slovakia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('slovenia', 'Slovenia', allCountries)).toBe(false)
      expect(isAmbiguous('slovakia', 'Slovakia', allCountries)).toBe(false)
    })

    it('they naturally disambiguate by their different letters', () => {
      // slova/slovak -> Slovakia only
      expect(isCloseEnough('slova', 'Slovakia')).toBe(true)
      expect(isCloseEnough('slova', 'Slovenia')).toBe(false)
      // slove/sloven -> Slovenia only
      expect(isCloseEnough('slove', 'Slovenia')).toBe(true)
      expect(isCloseEnough('slove', 'Slovakia')).toBe(false)
    })
  })

  describe('India vs Indonesia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('india', 'India', allCountries)).toBe(false)
      expect(isAmbiguous('indonesia', 'Indonesia', allCountries)).toBe(false)
    })

    it('indo is too short for Indonesia', () => {
      expect(isCloseEnough('indo', 'Indonesia')).toBe(false)
      expect(isCloseEnough('indo', 'India')).toBe(false)
    })
  })

  describe('Sudan vs Sør-Sudan', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('sudan', 'Sudan', allCountries)).toBe(false)
      expect(isAmbiguous('sør-sudan', 'Sør-Sudan', allCountries)).toBe(false)
    })

    it('sørsudan without hyphen is NOT ambiguous (Sudan is too short)', () => {
      // sørsudan only matches Sør-Sudan, not Sudan (too many extra chars)
      expect(isCloseEnough('sørsudan', 'Sør-Sudan')).toBe(true)
      expect(isCloseEnough('sørsudan', 'Sudan')).toBe(false)
      expect(isAmbiguous('sørsudan', 'Sør-Sudan', allCountries)).toBe(false)
    })
  })

  describe('Nord-Korea vs Sør-Korea', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('nord-korea', 'Nord-Korea', allCountries)).toBe(false)
      expect(isAmbiguous('sør-korea', 'Sør-Korea', allCountries)).toBe(false)
      expect(isAmbiguous('nordkorea', 'Nord-Korea', allCountries)).toBe(false)
      expect(isAmbiguous('sørkorea', 'Sør-Korea', allCountries)).toBe(false)
    })

    it('korea alone is too short/ambiguous', () => {
      // "korea" is too short for "Nord-Korea" (10 chars), fails length check
      expect(isCloseEnough('korea', 'Nord-Korea')).toBe(false)
    })
  })

  describe('Guinea variations', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('guinea', 'Guinea', allCountries)).toBe(false)
      expect(isAmbiguous('guinea-bissau', 'Guinea-Bissau', allCountries)).toBe(false)
    })
  })

  describe('unique countries are never ambiguous', () => {
    it('norge is unique', () => {
      expect(isAmbiguous('norge', 'Norge', allCountries)).toBe(false)
    })

    it('australia is unique (østerrike is different enough)', () => {
      expect(isAmbiguous('australia', 'Australia', allCountries)).toBe(false)
    })
  })
})

describe('isCloseEnough - realistic typing scenarios', () => {
  describe('should accept common typos', () => {
    it('missing double letters', () => {
      expect(isCloseEnough('marokko', 'Marokko')).toBe(true)
      expect(isCloseEnough('maroko', 'Marokko')).toBe(true)
      expect(isCloseEnough('filipinene', 'Filippinene')).toBe(true)
    })

    it('missing single letter', () => {
      expect(isCloseEnough('tysland', 'Tyskland')).toBe(true)
      expect(isCloseEnough('frankrike', 'Frankrike')).toBe(true)
      expect(isCloseEnough('frakrike', 'Frankrike')).toBe(true)
    })

    it('extra letter', () => {
      expect(isCloseEnough('norgee', 'Norge')).toBe(true)
      expect(isCloseEnough('sveriige', 'Sverige')).toBe(true)
    })

    it('minor typos in longer words', () => {
      expect(isCloseEnough('sverig', 'Sverige')).toBe(true)
      expect(isCloseEnough('tysklan', 'Tyskland')).toBe(true)
    })
  })

  describe('should accept without spaces/hyphens', () => {
    it('compound names without spaces', () => {
      expect(isCloseEnough('srilanka', 'Sri Lanka')).toBe(true)
      expect(isCloseEnough('newzealand', 'New Zealand')).toBe(true)
      expect(isCloseEnough('sørafrika', 'Sør-Afrika')).toBe(true)
      expect(isCloseEnough('saudiarabia', 'Saudi-Arabia')).toBe(true)
    })

    it('long compound names', () => {
      expect(isCloseEnough('densentralafrikanskerepublikk', 'Den sentralafrikanske republikk')).toBe(true)
      expect(isCloseEnough('deforentearabiskeemirater', 'De forente arabiske emirater')).toBe(true)
    })
  })

  describe('should reject wrong countries', () => {
    it('completely different countries', () => {
      expect(isCloseEnough('norge', 'Sverige')).toBe(false)
      expect(isCloseEnough('finland', 'Danmark')).toBe(false)
      expect(isCloseEnough('japan', 'Kina')).toBe(false)
    })

    it('very different names', () => {
      expect(isCloseEnough('østerrike', 'Australia')).toBe(false)
    })
  })

  describe('should reject very short inputs', () => {
    it('2-char partials rejected', () => {
      expect(isCloseEnough('no', 'Norge')).toBe(false)
      expect(isCloseEnough('sv', 'Sverige')).toBe(false)
    })
  })
})
