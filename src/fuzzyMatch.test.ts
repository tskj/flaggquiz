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
  const similarCountries = ['Mauritius', 'Mauritania', 'Mali', 'Malawi', 'Malaysia', 'Niger', 'Nigeria', 'Norge']

  describe('should detect ambiguity for partial matches', () => {
    it('maurit matches both Mauritius and Mauritania', () => {
      expect(isAmbiguous('maurit', 'Mauritius', similarCountries)).toBe(true)
      expect(isAmbiguous('maurit', 'Mauritania', similarCountries)).toBe(true)
    })

    it('niger matches both Niger and Nigeria', () => {
      expect(isAmbiguous('niger', 'Niger', similarCountries)).toBe(false) // exact match for Niger
      expect(isAmbiguous('niger', 'Nigeria', similarCountries)).toBe(true) // close to Nigeria but also matches Niger
    })

    it('nigeri matches both Niger and Nigeria', () => {
      expect(isAmbiguous('nigeri', 'Niger', similarCountries)).toBe(true)
      expect(isAmbiguous('nigeri', 'Nigeria', similarCountries)).toBe(true)
    })
  })

  describe('exact matches are never ambiguous', () => {
    it('mauritius is unambiguous (exact)', () => {
      expect(isAmbiguous('mauritius', 'Mauritius', similarCountries)).toBe(false)
    })

    it('mauritania is unambiguous (exact)', () => {
      expect(isAmbiguous('mauritania', 'Mauritania', similarCountries)).toBe(false)
    })

    it('nigeria is unambiguous (exact)', () => {
      expect(isAmbiguous('nigeria', 'Nigeria', similarCountries)).toBe(false)
    })

    it('niger is unambiguous (exact)', () => {
      expect(isAmbiguous('niger', 'Niger', similarCountries)).toBe(false)
    })

    it('unique country names are not ambiguous', () => {
      expect(isAmbiguous('norge', 'Norge', similarCountries)).toBe(false)
      expect(isAmbiguous('malaysia', 'Malaysia', similarCountries)).toBe(false)
    })
  })
})
