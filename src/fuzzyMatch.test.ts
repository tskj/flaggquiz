import { describe, it, expect } from 'vitest'
import { fuzzyMatch, isCloseEnough, isAmbiguous, checkAnswer } from './fuzzyMatch'
import { norwegianNames, alternativeNames } from './App'

// All Norwegian country names for realistic ambiguity testing
const allNorwegianNames = Object.values(norwegianNames)

describe('checkAnswer', () => {
  describe('exact matches', () => {
    it('returns match for exact main name', () => {
      expect(checkAnswer('Norge', 'Norge', allNorwegianNames)).toEqual(['match', 'Norge'])
      expect(checkAnswer('norge', 'Norge', allNorwegianNames)).toEqual(['match', 'Norge'])
    })

    it('returns match for exact alternative name', () => {
      expect(checkAnswer('UK', 'Storbritannia', allNorwegianNames, ['UK'])).toEqual(['match', 'UK'])
      expect(checkAnswer('Burma', 'Myanmar', allNorwegianNames, ['Burma'])).toEqual(['match', 'Burma'])
    })
  })

  describe('fuzzy matches', () => {
    it('returns match for fuzzy main name', () => {
      expect(checkAnswer('Norg', 'Norge', allNorwegianNames)).toEqual(['match', 'Norge'])
      expect(checkAnswer('Storbritania', 'Storbritannia', allNorwegianNames)).toEqual(['match', 'Storbritannia'])
    })

    it('returns match for fuzzy alternative name', () => {
      expect(checkAnswer('Amerik', 'De forente stater', allNorwegianNames, ['Amerika'])).toEqual(['match', 'Amerika'])
      expect(checkAnswer('Bruma', 'Myanmar', allNorwegianNames, ['Burma'])).toEqual(['match', 'Burma'])
    })
  })

  describe('ambiguous matches', () => {
    it('returns ambiguous with list of matching countries', () => {
      const result = checkAnswer('ira', 'Iran', allNorwegianNames)
      expect(result[0]).toBe('ambiguous')
      expect(result[1]).toContain('Iran')
      expect(result[1]).toContain('Irak')
    })

    it('returns ambiguous for maurit matching both Mauritius and Mauritania', () => {
      const result = checkAnswer('maurit', 'Mauritius', allNorwegianNames)
      expect(result[0]).toBe('ambiguous')
      expect(result[1]).toContain('Mauritius')
      expect(result[1]).toContain('Mauritania')
    })

    it('returns ambiguous for Sudan when answer is Sør-Sudan', () => {
      const result = checkAnswer('Sudan', 'Sør-Sudan', allNorwegianNames)
      expect(result[0]).toBe('ambiguous')
      expect(result[1]).toContain('Sør-Sudan')
      expect(result[1]).toContain('Sudan')
    })
  })

  describe('no match', () => {
    it('returns no_match for wrong answer', () => {
      expect(checkAnswer('Sverige', 'Norge', allNorwegianNames)).toEqual(['no_match'])
      expect(checkAnswer('Japan', 'Kina', allNorwegianNames)).toEqual(['no_match'])
    })

    it('returns no_match for too short input', () => {
      expect(checkAnswer('No', 'Norge', allNorwegianNames)).toEqual(['no_match'])
      expect(checkAnswer('Ir', 'Iran', allNorwegianNames)).toEqual(['no_match'])
    })

    it('returns no_match for gibberish', () => {
      expect(checkAnswer('asdfgh', 'Norge', allNorwegianNames)).toEqual(['no_match'])
    })
  })

  describe('exact match bypasses ambiguity', () => {
    it('exact Sudan for Sudan is match, not ambiguous', () => {
      expect(checkAnswer('Sudan', 'Sudan', allNorwegianNames)).toEqual(['match', 'Sudan'])
    })

    it('exact Iran for Iran is match, not ambiguous', () => {
      expect(checkAnswer('Iran', 'Iran', allNorwegianNames)).toEqual(['match', 'Iran'])
    })
  })

  describe('alternative names can cause ambiguity', () => {
    it('input matching another countrys alt name causes ambiguity', () => {
      // Test: if you type "Nansen" and answer is "Hansen", but another country has alt "Nansen"
      const allAltNames = { 'Nansenland': ['Nansen'] }
      const result = checkAnswer('Nansen', 'Hansen', ['Hansen', 'Nansenland'], [], allAltNames)
      expect(result[0]).toBe('ambiguous')
      expect(result[1]).toContain('Hansen')
      expect(result[1]).toContain('Nansenland')
    })

    it('typing Burm for Myanmar via Burma alt is not ambiguous with Burundi', () => {
      // Burm matches Burma (alt for Myanmar) but not Burundi (too different)
      const allAltNames = { 'Myanmar': ['Burma'] }
      const result = checkAnswer('Burm', 'Myanmar', allNorwegianNames, ['Burma'], allAltNames)
      expect(result).toEqual(['match', 'Burma'])
    })

    it('exact alt name match is never ambiguous', () => {
      const allAltNames = { 'Myanmar': ['Burma'] }
      const result = checkAnswer('Burma', 'Myanmar', allNorwegianNames, ['Burma'], allAltNames)
      expect(result).toEqual(['match', 'Burma'])
    })
  })
})

describe('alternativeNames', () => {
  it('has UK for United Kingdom', () => {
    expect(alternativeNames['United Kingdom']).toContain('UK')
  })

  it('has Amerika and De forente amerikanske stater for United States', () => {
    expect(alternativeNames['United States']).toContain('Amerika')
    expect(alternativeNames['United States']).toContain('De forente amerikanske stater')
  })

  it('has Burma for Myanmar', () => {
    expect(alternativeNames['Myanmar']).toContain('Burma')
  })
})

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

describe('isAmbiguous (with full country list)', () => {
  describe('Mauritius vs Mauritania', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('mauritius', 'Mauritius', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('mauritania', 'Mauritania', allNorwegianNames)).toBe(false)
    })

    it('partial "maurit" is ambiguous', () => {
      expect(isAmbiguous('maurit', 'Mauritius', allNorwegianNames)).toBe(true)
      expect(isAmbiguous('maurit', 'Mauritania', allNorwegianNames)).toBe(true)
    })

    it('typing more disambiguates', () => {
      expect(isAmbiguous('mauriti', 'Mauritius', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('maurita', 'Mauritania', allNorwegianNames)).toBe(false)
    })
  })

  describe('Niger vs Nigeria', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('niger', 'Niger', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('nigeria', 'Nigeria', allNorwegianNames)).toBe(false)
    })

    it('nigeri is ambiguous (close to both)', () => {
      expect(isAmbiguous('nigeri', 'Nigeria', allNorwegianNames)).toBe(true)
    })
  })

  describe('Mali vs Malawi vs Malaysia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('mali', 'Mali', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('malawi', 'Malawi', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('malaysia', 'Malaysia', allNorwegianNames)).toBe(false)
    })
  })

  describe('Iran vs Irak vs Irland', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('iran', 'Iran', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('irak', 'Irak', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('irland', 'Irland', allNorwegianNames)).toBe(false)
    })

    it('ira matches both Iran and Irak (close enough)', () => {
      expect(isCloseEnough('ira', 'Iran')).toBe(true)
      expect(isCloseEnough('ira', 'Irak')).toBe(true)
    })

    it('ira is rejected due to ambiguity, not length', () => {
      expect(isAmbiguous('ira', 'Iran', allNorwegianNames)).toBe(true)
      expect(isAmbiguous('ira', 'Irak', allNorwegianNames)).toBe(true)
    })
  })

  describe('Slovenia vs Slovakia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('slovenia', 'Slovenia', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('slovakia', 'Slovakia', allNorwegianNames)).toBe(false)
    })

    it('they naturally disambiguate by their different letters', () => {
      expect(isCloseEnough('slova', 'Slovakia')).toBe(true)
      expect(isCloseEnough('slova', 'Slovenia')).toBe(false)
      expect(isCloseEnough('slove', 'Slovenia')).toBe(true)
      expect(isCloseEnough('slove', 'Slovakia')).toBe(false)
    })
  })

  describe('India vs Indonesia', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('india', 'India', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('indonesia', 'Indonesia', allNorwegianNames)).toBe(false)
    })

    it('indo is too short for both', () => {
      expect(isCloseEnough('indo', 'Indonesia')).toBe(false)
      expect(isCloseEnough('indo', 'India')).toBe(false)
    })
  })

  describe('Sudan vs Sør-Sudan', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('sudan', 'Sudan', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('sør-sudan', 'Sør-Sudan', allNorwegianNames)).toBe(false)
    })

    it('sørsudan without hyphen is NOT ambiguous', () => {
      expect(isCloseEnough('sørsudan', 'Sør-Sudan')).toBe(true)
      expect(isCloseEnough('sørsudan', 'Sudan')).toBe(false)
      expect(isAmbiguous('sørsudan', 'Sør-Sudan', allNorwegianNames)).toBe(false)
    })

    it('typing just "Sudan" for Sør-Sudan is ambiguous', () => {
      // "Sudan" matches both countries, so it's ambiguous when answer is Sør-Sudan
      expect(isCloseEnough('Sudan', 'Sør-Sudan')).toBe(true)
      expect(isCloseEnough('Sudan', 'Sudan')).toBe(true)
      expect(isAmbiguous('Sudan', 'Sør-Sudan', allNorwegianNames)).toBe(true)
      // But exact match for Sudan itself is fine
      expect(isAmbiguous('Sudan', 'Sudan', allNorwegianNames)).toBe(false)
    })
  })

  describe('Nord-Korea vs Sør-Korea', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('nord-korea', 'Nord-Korea', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('sør-korea', 'Sør-Korea', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('nordkorea', 'Nord-Korea', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('sørkorea', 'Sør-Korea', allNorwegianNames)).toBe(false)
    })

    it('korea alone is too short', () => {
      expect(isCloseEnough('korea', 'Nord-Korea')).toBe(false)
    })
  })

  describe('Guinea variations', () => {
    it('exact matches work', () => {
      expect(isAmbiguous('guinea', 'Guinea', allNorwegianNames)).toBe(false)
      expect(isAmbiguous('guinea-bissau', 'Guinea-Bissau', allNorwegianNames)).toBe(false)
    })
  })

  describe('unique countries are never ambiguous', () => {
    it('norge is unique', () => {
      expect(isAmbiguous('norge', 'Norge', allNorwegianNames)).toBe(false)
    })

    it('australia is unique', () => {
      expect(isAmbiguous('australia', 'Australia', allNorwegianNames)).toBe(false)
    })
  })
})

describe('isCloseEnough - transposed letters', () => {
  it('accepts swapped adjacent letters', () => {
    expect(isCloseEnough('bharain', 'Bahrain')).toBe(true)
    expect(isCloseEnough('bharian', 'Bahrain')).toBe(true)
    expect(isCloseEnough('bleraus', 'Belarus')).toBe(true) // er -> re swap
  })

  it('accepts common keyboard transpositions', () => {
    expect(isCloseEnough('Bangaldesh', 'Bangladesh')).toBe(true) // ld -> dl
    expect(isCloseEnough('Jamacia', 'Jamaica')).toBe(true) // ai -> ia
    expect(isCloseEnough('Pakitsan', 'Pakistan')).toBe(true) // st -> ts
  })

  it('still rejects wrong countries even with transpositions', () => {
    expect(isCloseEnough('Sveirge', 'Norge')).toBe(false)
    expect(isCloseEnough('Dnamark', 'Finland')).toBe(false)
  })
})

describe('isCloseEnough - more realistic misspellings', () => {
  describe('should accept', () => {
    it('missing single letter in middle', () => {
      expect(isCloseEnough('Etiopa', 'Etiopia')).toBe(true)
      expect(isCloseEnough('Indonesa', 'Indonesia')).toBe(true)
      expect(isCloseEnough('Venezuea', 'Venezuela')).toBe(true)
    })

    it('missing double letters', () => {
      expect(isCloseEnough('Filipinene', 'Filippinene')).toBe(true)
      expect(isCloseEnough('Maroko', 'Marokko')).toBe(true)
    })

    it('ending variations', () => {
      expect(isCloseEnough('Argentin', 'Argentina')).toBe(true)
      expect(isCloseEnough('Colombian', 'Colombia')).toBe(true)
      expect(isCloseEnough('Venezuella', 'Venezuela')).toBe(true)
      expect(isCloseEnough('Nigeraia', 'Nigeria')).toBe(true) // extra letter at end
    })

    it('long names with typos', () => {
      expect(isCloseEnough('Kirgistan', 'Kirgisistan')).toBe(true)
      expect(isCloseEnough('Aserbadsjan', 'Aserbajdsjan')).toBe(true)
    })
  })

  describe('should reject', () => {
    it('wrong letter substitution in short words', () => {
      expect(isCloseEnough('Sverige', 'Sveits')).toBe(false)
      expect(isCloseEnough('Island', 'Irland')).toBe(false)
    })

    it('partial country names too short', () => {
      expect(isCloseEnough('Guinea', 'Ekvatorial-Guinea')).toBe(false)
      expect(isCloseEnough('Kongo', 'Republikken Kongo')).toBe(false)
      expect(isCloseEnough('Kongo', 'Den demokratiske republikken Kongo')).toBe(false)
    })

    it('completely wrong', () => {
      expect(isCloseEnough('Spania', 'Italia')).toBe(false)
      expect(isCloseEnough('Egypt', 'Libya')).toBe(false)
    })
  })
})

describe('alternative names', () => {
  it('should accept exact alternative names', () => {
    expect(isCloseEnough('UK', 'UK')).toBe(true)
    expect(isCloseEnough('Amerika', 'Amerika')).toBe(true)
    expect(isCloseEnough('Burma', 'Burma')).toBe(true)
  })

  it('should accept fuzzy matches on alternative names', () => {
    expect(isCloseEnough('Amerik', 'Amerika')).toBe(true)
    expect(isCloseEnough('Bruma', 'Burma')).toBe(true) // transposition
    expect(isCloseEnough('De forente amerikanske statene', 'De forente amerikanske stater')).toBe(true)
  })

  it('should reject inputs shorter than 3 characters', () => {
    expect(isCloseEnough('U', 'UK')).toBe(false)
    expect(isCloseEnough('Am', 'Amerika')).toBe(false)
  })
})

describe('alternative names with ambiguity', () => {
  // These test that alternative names work with the full country list
  it('Amerika should not be ambiguous with other countries', () => {
    expect(isCloseEnough('Amerika', 'Amerika')).toBe(true)
    expect(isAmbiguous('Amerika', 'Amerika', allNorwegianNames)).toBe(false)
  })

  it('Burma should not be ambiguous', () => {
    expect(isCloseEnough('Burma', 'Burma')).toBe(true)
    expect(isAmbiguous('Burma', 'Burma', allNorwegianNames)).toBe(false)
  })

  it('UK exact match is not ambiguous', () => {
    // UK could potentially match Ukraine if fuzzy, but exact match is fine
    expect(isAmbiguous('UK', 'UK', allNorwegianNames)).toBe(false)
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
