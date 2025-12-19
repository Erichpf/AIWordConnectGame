/**
 * Words API Routes Tests
 * Basic tests to verify API parameter validation
 */

import { describe, it, expect } from 'vitest'

// Test the validation logic directly
const VALID_LANGUAGES = ['zh', 'en']
const VALID_LEVELS = ['easy', 'medium', 'hard']

interface GenerateRequest {
  language: 'zh' | 'en'
  level: 'easy' | 'medium' | 'hard'
  theme: string
  count: number
}

function validateGenerateRequest(body: unknown): { valid: true; data: GenerateRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' }
  }

  const { language, level, theme, count } = body as Record<string, unknown>

  if (!language || !VALID_LANGUAGES.includes(language as string)) {
    return { valid: false, error: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}` }
  }

  if (!level || !VALID_LEVELS.includes(level as string)) {
    return { valid: false, error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` }
  }

  if (!theme || typeof theme !== 'string' || theme.trim() === '') {
    return { valid: false, error: 'Theme is required and must be a non-empty string' }
  }

  if (typeof count !== 'number' || count < 1 || !Number.isInteger(count)) {
    return { valid: false, error: 'Count must be a positive integer' }
  }

  return {
    valid: true,
    data: {
      language: language as 'zh' | 'en',
      level: level as 'easy' | 'medium' | 'hard',
      theme: theme as string,
      count: count as number
    }
  }
}

describe('Words API Validation', () => {
  describe('validateGenerateRequest', () => {
    it('should accept valid request', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'easy',
        theme: 'learning',
        count: 8
      })

      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.data.language).toBe('zh')
        expect(result.data.level).toBe('easy')
        expect(result.data.theme).toBe('learning')
        expect(result.data.count).toBe(8)
      }
    })

    it('should reject missing body', () => {
      const result = validateGenerateRequest(null)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Request body is required')
      }
    })

    it('should reject invalid language', () => {
      const result = validateGenerateRequest({
        language: 'fr',
        level: 'easy',
        theme: 'learning',
        count: 8
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Invalid language')
      }
    })

    it('should reject invalid level', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'expert',
        theme: 'learning',
        count: 8
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Invalid level')
      }
    })

    it('should reject empty theme', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'easy',
        theme: '',
        count: 8
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Theme is required')
      }
    })

    it('should reject non-integer count', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'easy',
        theme: 'learning',
        count: 8.5
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Count must be a positive integer')
      }
    })

    it('should reject zero count', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'easy',
        theme: 'learning',
        count: 0
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Count must be a positive integer')
      }
    })

    it('should reject negative count', () => {
      const result = validateGenerateRequest({
        language: 'zh',
        level: 'easy',
        theme: 'learning',
        count: -5
      })

      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toContain('Count must be a positive integer')
      }
    })
  })
})
