/**
 * Words API Routes
 * Requirements: 8.1, 5.4
 */

import { Router, Request, Response } from 'express'
import { GenerateRequest, GenerateResponse, ErrorResponse, Language, Level } from 'shared'
import { AIService } from '../services/AIService.js'
import { LocalWordBank } from '../services/LocalWordBank.js'

const router = Router()
const aiService = new AIService()
const localWordBank = new LocalWordBank()

// Valid values for validation
const VALID_LANGUAGES: Language[] = ['zh', 'en']
const VALID_LEVELS: Level[] = ['easy', 'medium', 'hard']
const VALID_THEMES = ['learning', 'virtue', 'growth', 'technology']

/**
 * Validate generate request parameters
 */
function validateGenerateRequest(body: unknown): { valid: true; data: GenerateRequest } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' }
  }

  const { language, level, theme, count } = body as Record<string, unknown>

  if (!language || !VALID_LANGUAGES.includes(language as Language)) {
    return { valid: false, error: `Invalid language. Must be one of: ${VALID_LANGUAGES.join(', ')}` }
  }

  if (!level || !VALID_LEVELS.includes(level as Level)) {
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
      language: language as Language,
      level: level as Level,
      theme: theme as string,
      count: count as number
    }
  }
}

/**
 * POST /api/words/generate
 * Generate word pairs for the game
 */
router.post('/generate', async (req: Request, res: Response) => {
  const validation = validateGenerateRequest(req.body)

  if (!validation.valid) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: validation.error
      }
    }
    res.status(400).json(errorResponse)
    return
  }

  const { language, level, theme, count } = validation.data

  try {
    // Try AI service first
    const aiResult = await aiService.generateContent({ language, level, theme, count })
    
    if (aiResult.success) {
      const response: GenerateResponse = {
        success: true,
        data: aiResult.data,
        source: 'ai'
      }
      res.json(response)
      return
    }

    // Fall back to local word bank
    const localWords = localWordBank.getWords(language, level, theme, count)
    const response: GenerateResponse = {
      success: true,
      data: localWords,
      source: 'local'
    }
    res.json(response)
  } catch (error) {
    console.error('Error generating words:', error)
    
    // Fall back to local word bank on any error
    try {
      const localWords = localWordBank.getWords(language, level, theme, count)
      const response: GenerateResponse = {
        success: true,
        data: localWords,
        source: 'local'
      }
      res.json(response)
    } catch (localError) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate words from both AI and local sources'
        }
      }
      res.status(500).json(errorResponse)
    }
  }
})

/**
 * POST /api/words/explain
 * Get AI explanation for a word pair
 */
router.post('/explain', async (req: Request, res: Response) => {
  const { word, meaning, isCorrect } = req.body

  if (!word || typeof word !== 'string') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'Word is required'
      }
    }
    res.status(400).json(errorResponse)
    return
  }

  if (!meaning || typeof meaning !== 'string') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'Meaning is required'
      }
    }
    res.status(400).json(errorResponse)
    return
  }

  try {
    const explanation = await aiService.generateExplanation(word, meaning, isCorrect ?? true)
    res.json({ success: true, explanation })
  } catch (error) {
    res.json({ success: true, explanation: `${word}: ${meaning}` })
  }
})

/**
 * POST /api/words/summary
 * Get AI learning summary
 */
router.post('/summary', async (req: Request, res: Response) => {
  const { stats } = req.body

  if (!stats || typeof stats !== 'object') {
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: 'Stats object is required'
      }
    }
    res.status(400).json(errorResponse)
    return
  }

  try {
    const summary = await aiService.generateSummary(stats)
    res.json({ success: true, summary })
  } catch (error) {
    res.json({ 
      success: true, 
      summary: `游戏完成！正确: ${stats.correct}, 错误: ${stats.wrong}` 
    })
  }
})

export default router
