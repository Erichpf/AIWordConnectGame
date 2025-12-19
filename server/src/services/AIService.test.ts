/**
 * AIService Tests
 * Basic tests to verify AI service functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AIService } from './AIService.js'

describe('AIService', () => {
  let aiService: AIService

  beforeEach(() => {
    aiService = new AIService()
  })

  describe('buildPrompt', () => {
    it('should build Chinese prompt correctly', () => {
      const prompt = aiService.buildPrompt({
        language: 'zh',
        level: 'easy',
        theme: 'learning',
        count: 4
      })

      expect(prompt).toContain('4')
      expect(prompt).toContain('learning')
      expect(prompt).toContain('中文成语')
      expect(prompt).toContain('JSON')
    })

    it('should build English prompt correctly', () => {
      const prompt = aiService.buildPrompt({
        language: 'en',
        level: 'medium',
        theme: 'technology',
        count: 6
      })

      expect(prompt).toContain('6')
      expect(prompt).toContain('technology')
      expect(prompt).toContain('English')
      expect(prompt).toContain('JSON')
    })
  })

  describe('parseResponse', () => {
    it('should parse valid JSON array response', () => {
      const response = JSON.stringify([
        { word: '学而不厌', meaning: '学习而不感到满足', hint: '出自论语' },
        { word: '温故知新', meaning: '复习旧知识获得新理解', hint: '孔子名言' }
      ])

      const cards = aiService.parseResponse(response, 2)

      expect(cards.length).toBe(4) // 2 pairs = 4 cards
      expect(cards.filter(c => c.type === 'word').length).toBe(2)
      expect(cards.filter(c => c.type === 'meaning').length).toBe(2)
    })

    it('should parse JSON with markdown code block', () => {
      const response = '```json\n[{"word": "test", "meaning": "测试", "hint": "example"}]\n```'

      const cards = aiService.parseResponse(response, 1)

      expect(cards.length).toBe(2)
      expect(cards[0].word).toBe('test')
    })

    it('should throw error for invalid JSON', () => {
      expect(() => {
        aiService.parseResponse('not valid json', 1)
      }).toThrow()
    })

    it('should skip invalid entries', () => {
      const response = JSON.stringify([
        { word: '有效词', meaning: '有效释义', hint: '有效提示' },
        { word: '', meaning: '无效', hint: '' }, // invalid - empty word
        { word: '另一个', meaning: '另一个释义', hint: '另一个提示' }
      ])

      const cards = aiService.parseResponse(response, 3)

      // Should only get 2 valid pairs (4 cards)
      expect(cards.length).toBe(4)
    })
  })
})
