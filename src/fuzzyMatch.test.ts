import { describe, it, expect } from 'vitest'
import { fuzzyMatch, isCloseEnough } from './fuzzyMatch'

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
    })
  })
})
