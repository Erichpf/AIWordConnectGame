/**
 * LocalWordBank Service Tests
 * Basic tests to verify the local word bank functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { LocalWordBank } from './LocalWordBank.js'

describe('LocalWordBank', () => {
  let wordBank: LocalWordBank

  beforeEach(() => {
    wordBank = new LocalWordBank()
  })

  describe('getWords', () => {
    it('should return word cards for Chinese idioms', () => {
      const cards = wordBank.getWords('zh', 'easy', 'learning', 4)
      
      expect(cards).toBeDefined()
      expect(Array.isArray(cards)).toBe(true)
      // Should return pairs (word + meaning for each)
      expect(cards.length).toBe(8) // 4 pairs = 8 cards
    })

    it('should return word cards for English vocabulary', () => {
      const cards = wordBank.getWords('en', 'easy', 'learning', 4)
      
      expect(cards).toBeDefined()
      expect(Array.isArray(cards)).toBe(true)
      expect(cards.length).toBe(8)
    })

    it('should return cards with required fields', () => {
      const cards = wordBank.getWords('zh', 'easy', 'learning', 2)
      
      cards.forEach(card => {
        expect(card.id).toBeDefined()
        expect(card.word).toBeDefined()
        expect(card.meaning).toBeDefined()
        expect(card.hint).toBeDefined()
        expect(card.type).toMatch(/^(word|meaning)$/)
        expect(card.pairId).toBeDefined()
      })
    })

    it('should create matching pairs with same pairId', () => {
      const cards = wordBank.getWords('zh', 'easy', 'learning', 2)
      
      // Group by pairId
      const pairGroups = new Map<string, typeof cards>()
      cards.forEach(card => {
        const group = pairGroups.get(card.pairId) || []
        group.push(card)
        pairGroups.set(card.pairId, group)
      })

      // Each pair should have exactly 2 cards
      pairGroups.forEach((group, pairId) => {
        expect(group.length).toBe(2)
        // One should be 'word' type, one should be 'meaning' type
        const types = group.map(c => c.type).sort()
        expect(types).toEqual(['meaning', 'word'])
      })
    })
  })

  describe('getAvailableThemes', () => {
    it('should return available themes for Chinese', () => {
      const themes = wordBank.getAvailableThemes('zh')
      
      expect(themes).toBeDefined()
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('should return available themes for English', () => {
      const themes = wordBank.getAvailableThemes('en')
      
      expect(themes).toBeDefined()
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })
  })
})
