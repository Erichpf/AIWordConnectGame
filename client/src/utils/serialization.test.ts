/**
 * Tests for Game State Serialization
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { describe, it, expect } from 'vitest'
import {
  serializeGameState,
  deserializeGameState,
  validateAndRestoreGameState,
  areGameStatesEqual,
  GameStateValidationError
} from './serialization'
import type { GameState, WordCard } from 'shared'

// Helper to create a valid WordCard
function createWordCard(
  id: string,
  word: string,
  meaning: string,
  type: 'word' | 'meaning',
  pairId: string
): WordCard {
  return {
    id,
    word,
    meaning,
    hint: `Hint for ${word}`,
    type,
    pairId
  }
}

// Helper to create a valid GameState
function createValidGameState(): GameState {
  const card1 = createWordCard('1', '学习', 'study', 'word', 'pair1')
  const card2 = createWordCard('2', '学习', 'study', 'meaning', 'pair1')
  const card3 = createWordCard('3', '成长', 'growth', 'word', 'pair2')
  const card4 = createWordCard('4', '成长', 'growth', 'meaning', 'pair2')

  return {
    config: {
      language: 'zh',
      level: 'easy',
      theme: 'learning',
      boardSize: { rows: 2, cols: 2 }
    },
    board: {
      grid: [
        [card1, card2],
        [card3, card4]
      ],
      rows: 2,
      cols: 2
    },
    score: {
      correct: 0,
      wrong: 0
    },
    elapsedTime: 0,
    selectedCard: null,
    isComplete: false
  }
}

describe('serializeGameState', () => {
  it('should serialize a valid game state to JSON string', () => {
    const state = createValidGameState()
    const json = serializeGameState(state)
    
    expect(typeof json).toBe('string')
    expect(() => JSON.parse(json)).not.toThrow()
  })

  it('should include all required fields in serialized output', () => {
    const state = createValidGameState()
    const json = serializeGameState(state)
    const parsed = JSON.parse(json)
    
    expect(parsed).toHaveProperty('config')
    expect(parsed).toHaveProperty('board')
    expect(parsed).toHaveProperty('score')
    expect(parsed).toHaveProperty('elapsedTime')
    expect(parsed).toHaveProperty('selectedCard')
    expect(parsed).toHaveProperty('isComplete')
  })
})

describe('deserializeGameState', () => {
  it('should deserialize a valid JSON string to GameState', () => {
    const originalState = createValidGameState()
    const json = serializeGameState(originalState)
    const restoredState = deserializeGameState(json)
    
    expect(restoredState.config.language).toBe('zh')
    expect(restoredState.config.level).toBe('easy')
    expect(restoredState.board.rows).toBe(2)
    expect(restoredState.board.cols).toBe(2)
  })

  it('should throw GameStateValidationError for invalid JSON', () => {
    expect(() => deserializeGameState('not valid json')).toThrow(GameStateValidationError)
    expect(() => deserializeGameState('not valid json')).toThrow('Invalid JSON format')
  })

  it('should throw GameStateValidationError for non-object JSON', () => {
    expect(() => deserializeGameState('"string"')).toThrow(GameStateValidationError)
    expect(() => deserializeGameState('123')).toThrow(GameStateValidationError)
    expect(() => deserializeGameState('null')).toThrow(GameStateValidationError)
  })
})

describe('validateAndRestoreGameState', () => {
  it('should validate config.language', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.config.language = 'invalid'
    
    expect(() => validateAndRestoreGameState(json)).toThrow('config.language must be "zh" or "en"')
  })

  it('should validate config.level', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.config.level = 'invalid'
    
    expect(() => validateAndRestoreGameState(json)).toThrow('config.level must be "easy", "medium", or "hard"')
  })

  it('should validate board.rows', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.board.rows = -1
    
    expect(() => validateAndRestoreGameState(json)).toThrow('board.rows must be a positive number')
  })

  it('should validate board.grid dimensions', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.board.rows = 3 // Mismatch with actual grid
    
    expect(() => validateAndRestoreGameState(json)).toThrow('board.grid must have 3 rows')
  })

  it('should validate score.correct is non-negative integer', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.score.correct = -1
    
    expect(() => validateAndRestoreGameState(json)).toThrow('score.correct must be a non-negative integer')
  })

  it('should validate elapsedTime is non-negative', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.elapsedTime = -10
    
    expect(() => validateAndRestoreGameState(json)).toThrow('elapsedTime must be a non-negative number')
  })

  it('should validate isComplete is boolean', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    json.isComplete = 'yes'
    
    expect(() => validateAndRestoreGameState(json)).toThrow('isComplete must be a boolean')
  })

  it('should validate WordCard required fields', () => {
    const state = createValidGameState()
    const json = JSON.parse(serializeGameState(state))
    delete json.board.grid[0][0].pairId
    
    expect(() => validateAndRestoreGameState(json)).toThrow('pairId must be a string')
  })

  it('should handle null cells in grid', () => {
    const state = createValidGameState()
    state.board.grid[0][0] = null
    const json = serializeGameState(state)
    const restored = deserializeGameState(json)
    
    expect(restored.board.grid[0][0]).toBeNull()
  })

  it('should handle selectedCard position', () => {
    const state = createValidGameState()
    state.selectedCard = { row: 1, col: 0 }
    const json = serializeGameState(state)
    const restored = deserializeGameState(json)
    
    expect(restored.selectedCard).toEqual({ row: 1, col: 0 })
  })

  it('should preserve optional confuse field', () => {
    const state = createValidGameState()
    state.board.grid[0][0]!.confuse = '混淆词'
    const json = serializeGameState(state)
    const restored = deserializeGameState(json)
    
    expect(restored.board.grid[0][0]!.confuse).toBe('混淆词')
  })
})

describe('areGameStatesEqual', () => {
  it('should return true for identical states', () => {
    const state1 = createValidGameState()
    const state2 = createValidGameState()
    
    expect(areGameStatesEqual(state1, state2)).toBe(true)
  })

  it('should return false for different config', () => {
    const state1 = createValidGameState()
    const state2 = createValidGameState()
    state2.config.language = 'en'
    
    expect(areGameStatesEqual(state1, state2)).toBe(false)
  })

  it('should return false for different scores', () => {
    const state1 = createValidGameState()
    const state2 = createValidGameState()
    state2.score.correct = 5
    
    expect(areGameStatesEqual(state1, state2)).toBe(false)
  })

  it('should return false for different board content', () => {
    const state1 = createValidGameState()
    const state2 = createValidGameState()
    state2.board.grid[0][0] = null
    
    expect(areGameStatesEqual(state1, state2)).toBe(false)
  })
})

describe('Round-trip serialization', () => {
  it('should preserve all properties after serialize/deserialize', () => {
    const original = createValidGameState()
    original.score = { correct: 5, wrong: 2 }
    original.elapsedTime = 120
    original.selectedCard = { row: 0, col: 1 }
    original.isComplete = false
    
    const json = serializeGameState(original)
    const restored = deserializeGameState(json)
    
    expect(areGameStatesEqual(original, restored)).toBe(true)
  })

  it('should preserve completed game state', () => {
    const original = createValidGameState()
    original.board.grid = [
      [null, null],
      [null, null]
    ]
    original.score = { correct: 2, wrong: 1 }
    original.elapsedTime = 300
    original.isComplete = true
    
    const json = serializeGameState(original)
    const restored = deserializeGameState(json)
    
    expect(areGameStatesEqual(original, restored)).toBe(true)
  })
})
