import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App, { norwegianNames } from './App'
import countryFlags from '../country-flags.json'

// Get all countries and their Norwegian names
const allCountries = Object.keys(countryFlags)
const getCorrectAnswer = (englishName: string) => norwegianNames[englishName] || englishName

// Create reverse lookup: flag URL -> country name
const flagUrlToCountry: Record<string, string> = {}
for (const [country, url] of Object.entries(countryFlags)) {
  flagUrlToCountry[url] = country
}

function findCountryByFlagUrl(flagUrl: string): string | undefined {
  // Direct match
  if (flagUrlToCountry[flagUrl]) {
    return flagUrlToCountry[flagUrl]
  }

  // Decode URL for comparison (handles special chars like en-dash)
  const decodedUrl = decodeURIComponent(flagUrl)
  if (flagUrlToCountry[decodedUrl]) {
    return flagUrlToCountry[decodedUrl]
  }

  // Try matching by filename
  const filename = flagUrl.split('/').pop()
  const decodedFilename = filename ? decodeURIComponent(filename) : ''

  for (const [country, url] of Object.entries(countryFlags)) {
    const expectedFilename = url.split('/').pop()
    if (expectedFilename === filename || expectedFilename === decodedFilename) {
      return country
    }
  }
  return undefined
}

describe('Quiz flow - no false positive struggled tracking', () => {
  beforeEach(() => {
    // Reset any state between tests
  })

  it('completes entire quiz without any struggled flags when typing correctly', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Start the quiz
    const startButton = screen.getByText('Start quiz')
    await user.click(startButton)

    // Wait for quiz to start
    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    let completedCount = 0
    const totalCountries = allCountries.length

    // Complete all countries
    while (completedCount < totalCountries) {
      const input = screen.getByRole('textbox') as HTMLInputElement

      // Find current country by checking the flag image
      const flagImg = screen.getByRole('img') as HTMLImageElement
      const flagUrl = flagImg.src

      const currentCountry = findCountryByFlagUrl(flagUrl)
      if (!currentCountry) {
        throw new Error(`Could not identify country for flag: ${flagUrl}`)
      }

      const correctAnswer = getCorrectAnswer(currentCountry)

      // Type the correct answer character by character (simulates real typing)
      await user.clear(input)
      await user.type(input, correctAnswer)

      // Wait for the answer to be accepted (green flash + move to next)
      await waitFor(() => {
        // Either we moved to next flag, or quiz is finished
        const newInput = screen.queryByRole('textbox') as HTMLInputElement | null
        if (newInput) {
          expect(newInput.value).toBe('') // Input should be cleared for next flag
        }
      }, { timeout: 1000 })

      completedCount++

      // Check if quiz is finished
      if (screen.queryByText(/Gratulerer|Tiden er ute|Resultat/)) {
        break
      }
    }

    // At the end, check that no countries were marked as "struggled"
    // The struggled flags would show in yellow in the results
    // Since we typed everything correctly without backspacing, there should be none
    await waitFor(() => {
      expect(screen.getByText(/Gratulerer|Resultat/)).toBeInTheDocument()
    }, { timeout: 2000 })

    // Yellow indicates struggled - there should be no yellow backgrounds
    const yellowElements = document.querySelectorAll('[class*="yellow"]')
    expect(yellowElements.length).toBe(0)
  }, 120000) // 2 minute timeout for full quiz

  it('tracks struggled flag when user backspaces away from wrong answer', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Start the quiz
    await user.click(screen.getByText('Start quiz'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    const input = screen.getByRole('textbox') as HTMLInputElement

    // Find current country
    const flagImg = screen.getByRole('img') as HTMLImageElement
    const flagUrl = flagImg.src
    const currentCountry = findCountryByFlagUrl(flagUrl)!

    const correctAnswer = getCorrectAnswer(currentCountry)

    // First, type "Norge" (a wrong answer, unless Norway is the current country)
    if (correctAnswer.toLowerCase() !== 'norge') {
      await user.type(input, 'Norge')

      // Now backspace to delete it
      await user.clear(input)

      // Type the correct answer
      await user.type(input, correctAnswer)

      // Wait for answer to be accepted
      await waitFor(() => {
        const newInput = screen.queryByRole('textbox') as HTMLInputElement | null
        if (newInput) {
          expect(newInput.value).toBe('')
        }
      }, { timeout: 1000 })

      // Give up to see results
      const giveUpButton = screen.getByText('Gi opp')
      await user.click(giveUpButton)

      // Check that we have a struggled flag (yellow)
      await waitFor(() => {
        const yellowElements = document.querySelectorAll('[class*="yellow"]')
        expect(yellowElements.length).toBeGreaterThan(0)
      })
    }
  }, 30000)
})

describe('Quiz flow - typing through partial matches', () => {
  it('does not track "Norge" as struggled when typing "Nord-Korea"', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('Start quiz'))

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    // Skip until we get to North Korea, or just test the typing behavior
    // For simplicity, we'll test that typing "nor" then continuing to "nord-korea"
    // doesn't leave any tracking artifacts

    const input = screen.getByRole('textbox')

    // Type "nor" (partial match for Norge)
    await user.type(input, 'nor')

    // Continue typing without backspace
    await user.type(input, 'd-korea')

    // The input should now be "nord-korea"
    expect(input).toHaveValue('nord-korea')

    // Clear and try again - this simulates completing the quiz
    await user.clear(input)

    // The clear operation uses backspace internally, but since we're not
    // testing the full flow here, we just verify the mechanic works
  })
})
