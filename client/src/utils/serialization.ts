/**
 * Game State Serialization Utilities
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 * - 9.1: Serialize current board state to JSON format
 * - 9.2: Deserialize JSON data back to valid game state
 * - 9.3: Include board layout, remaining cards, score, and elapsed time
 * - 9.4: Validate data integrity before restoring
 * - 9.5: Preserve all game state properties exactly on round-trip
 */

import type { 
  GameState, 
  GameConfig, 
  BoardState, 
  GameScore, 
  Position,
  WordCard,
  Language,
  Level,
  CardType
} from 'shared'

/**
 * Validation error for game state deserialization
 */
export class GameStateValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GameStateValidationError'
  }
}

/**
 * Serialize GameState to JSON string
 * @param state The game state to serialize
 * @returns JSON string representation
 */
export function serializeGameState(state: GameState): string {
  return JSON.stringify(state)
}

/**
 * Deserialize JSON string to GameState with validation
 * @param json JSON string to deserialize
 * @returns Validated GameState object
 * @throws GameStateValidationError if validation fails
 */
export function deserializeGameState(json: string): GameState {
  let parsed: unknown
  
  try {
    parsed = JSON.parse(json)
  } catch (e) {
    throw new GameStateValidationError('Invalid JSON format')
  }

  return validateAndRestoreGameState(parsed)
}

/**
 * Validate and restore a parsed object to GameState
 * @param data Parsed JSON data
 * @returns Validated GameState
 * @throws GameStateValidationError if validation fails
 */
export function validateAndRestoreGameState(data: unknown): GameState {
  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError('Game state must be an object')
  }

  const obj = data as Record<string, unknown>

  // Validate config
  const config = validateGameConfig(obj.config)
  
  // Validate board
  const board = validateBoardState(obj.board)
  
  // Validate score
  const score = validateGameScore(obj.score)
  
  // Validate elapsedTime
  if (typeof obj.elapsedTime !== 'number' || obj.elapsedTime < 0) {
    throw new GameStateValidationError('elapsedTime must be a non-negative number')
  }
  
  // Validate selectedCard
  const selectedCard = validateSelectedCard(obj.selectedCard)
  
  // Validate isComplete
  if (typeof obj.isComplete !== 'boolean') {
    throw new GameStateValidationError('isComplete must be a boolean')
  }

  return {
    config,
    board,
    score,
    elapsedTime: obj.elapsedTime,
    selectedCard,
    isComplete: obj.isComplete
  }
}

/**
 * Validate GameConfig
 */
function validateGameConfig(data: unknown): GameConfig {
  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError('config must be an object')
  }

  const obj = data as Record<string, unknown>

  // Validate language
  if (!isValidLanguage(obj.language)) {
    throw new GameStateValidationError('config.language must be "zh" or "en"')
  }

  // Validate level
  if (!isValidLevel(obj.level)) {
    throw new GameStateValidationError('config.level must be "easy", "medium", or "hard"')
  }

  // Validate theme
  if (typeof obj.theme !== 'string') {
    throw new GameStateValidationError('config.theme must be a string')
  }

  // Validate boardSize
  if (!obj.boardSize || typeof obj.boardSize !== 'object') {
    throw new GameStateValidationError('config.boardSize must be an object')
  }

  const boardSize = obj.boardSize as Record<string, unknown>
  if (typeof boardSize.rows !== 'number' || boardSize.rows <= 0) {
    throw new GameStateValidationError('config.boardSize.rows must be a positive number')
  }
  if (typeof boardSize.cols !== 'number' || boardSize.cols <= 0) {
    throw new GameStateValidationError('config.boardSize.cols must be a positive number')
  }

  return {
    language: obj.language as Language,
    level: obj.level as Level,
    theme: obj.theme,
    boardSize: {
      rows: boardSize.rows,
      cols: boardSize.cols
    }
  }
}

/**
 * Validate BoardState
 */
function validateBoardState(data: unknown): BoardState {
  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError('board must be an object')
  }

  const obj = data as Record<string, unknown>

  // Validate rows and cols
  if (typeof obj.rows !== 'number' || obj.rows <= 0) {
    throw new GameStateValidationError('board.rows must be a positive number')
  }
  if (typeof obj.cols !== 'number' || obj.cols <= 0) {
    throw new GameStateValidationError('board.cols must be a positive number')
  }

  // Validate grid
  if (!Array.isArray(obj.grid)) {
    throw new GameStateValidationError('board.grid must be an array')
  }

  if (obj.grid.length !== obj.rows) {
    throw new GameStateValidationError(`board.grid must have ${obj.rows} rows`)
  }

  const grid: (WordCard | null)[][] = []
  
  for (let r = 0; r < obj.rows; r++) {
    const row = obj.grid[r]
    if (!Array.isArray(row)) {
      throw new GameStateValidationError(`board.grid[${r}] must be an array`)
    }
    if (row.length !== obj.cols) {
      throw new GameStateValidationError(`board.grid[${r}] must have ${obj.cols} columns`)
    }

    const validatedRow: (WordCard | null)[] = []
    for (let c = 0; c < obj.cols; c++) {
      const cell = row[c]
      if (cell === null) {
        validatedRow.push(null)
      } else {
        validatedRow.push(validateWordCard(cell, r, c))
      }
    }
    grid.push(validatedRow)
  }

  return {
    grid,
    rows: obj.rows,
    cols: obj.cols
  }
}

/**
 * Validate WordCard
 */
function validateWordCard(data: unknown, row: number, col: number): WordCard {
  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError(`board.grid[${row}][${col}] must be an object or null`)
  }

  const obj = data as Record<string, unknown>

  // Required fields
  if (typeof obj.id !== 'string') {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].id must be a string`)
  }
  if (typeof obj.word !== 'string') {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].word must be a string`)
  }
  if (typeof obj.meaning !== 'string') {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].meaning must be a string`)
  }
  if (typeof obj.hint !== 'string') {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].hint must be a string`)
  }
  if (!isValidCardType(obj.type)) {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].type must be "word" or "meaning"`)
  }
  if (typeof obj.pairId !== 'string') {
    throw new GameStateValidationError(`WordCard at [${row}][${col}].pairId must be a string`)
  }

  const card: WordCard = {
    id: obj.id,
    word: obj.word,
    meaning: obj.meaning,
    hint: obj.hint,
    type: obj.type as CardType,
    pairId: obj.pairId
  }

  // Optional field
  if (obj.confuse !== undefined) {
    if (typeof obj.confuse !== 'string') {
      throw new GameStateValidationError(`WordCard at [${row}][${col}].confuse must be a string if present`)
    }
    card.confuse = obj.confuse
  }

  return card
}

/**
 * Validate GameScore
 */
function validateGameScore(data: unknown): GameScore {
  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError('score must be an object')
  }

  const obj = data as Record<string, unknown>

  if (typeof obj.correct !== 'number' || obj.correct < 0 || !Number.isInteger(obj.correct)) {
    throw new GameStateValidationError('score.correct must be a non-negative integer')
  }
  if (typeof obj.wrong !== 'number' || obj.wrong < 0 || !Number.isInteger(obj.wrong)) {
    throw new GameStateValidationError('score.wrong must be a non-negative integer')
  }

  return {
    correct: obj.correct,
    wrong: obj.wrong
  }
}

/**
 * Validate selectedCard (Position | null)
 */
function validateSelectedCard(data: unknown): Position | null {
  if (data === null) {
    return null
  }

  if (!data || typeof data !== 'object') {
    throw new GameStateValidationError('selectedCard must be an object or null')
  }

  const obj = data as Record<string, unknown>

  if (typeof obj.row !== 'number' || !Number.isInteger(obj.row) || obj.row < 0) {
    throw new GameStateValidationError('selectedCard.row must be a non-negative integer')
  }
  if (typeof obj.col !== 'number' || !Number.isInteger(obj.col) || obj.col < 0) {
    throw new GameStateValidationError('selectedCard.col must be a non-negative integer')
  }

  return {
    row: obj.row,
    col: obj.col
  }
}

/**
 * Type guards
 */
function isValidLanguage(value: unknown): value is Language {
  return value === 'zh' || value === 'en'
}

function isValidLevel(value: unknown): value is Level {
  return value === 'easy' || value === 'medium' || value === 'hard'
}

function isValidCardType(value: unknown): value is CardType {
  return value === 'word' || value === 'meaning'
}

/**
 * Check if two GameState objects are equivalent
 * Useful for testing round-trip serialization
 */
export function areGameStatesEqual(state1: GameState, state2: GameState): boolean {
  // Compare config
  if (state1.config.language !== state2.config.language) return false
  if (state1.config.level !== state2.config.level) return false
  if (state1.config.theme !== state2.config.theme) return false
  if (state1.config.boardSize.rows !== state2.config.boardSize.rows) return false
  if (state1.config.boardSize.cols !== state2.config.boardSize.cols) return false

  // Compare board dimensions
  if (state1.board.rows !== state2.board.rows) return false
  if (state1.board.cols !== state2.board.cols) return false

  // Compare grid
  for (let r = 0; r < state1.board.rows; r++) {
    for (let c = 0; c < state1.board.cols; c++) {
      const card1 = state1.board.grid[r][c]
      const card2 = state2.board.grid[r][c]
      
      if (card1 === null && card2 === null) continue
      if (card1 === null || card2 === null) return false
      
      if (!areWordCardsEqual(card1, card2)) return false
    }
  }

  // Compare score
  if (state1.score.correct !== state2.score.correct) return false
  if (state1.score.wrong !== state2.score.wrong) return false

  // Compare elapsedTime
  if (state1.elapsedTime !== state2.elapsedTime) return false

  // Compare selectedCard
  if (state1.selectedCard === null && state2.selectedCard === null) {
    // Both null, OK
  } else if (state1.selectedCard === null || state2.selectedCard === null) {
    return false
  } else {
    if (state1.selectedCard.row !== state2.selectedCard.row) return false
    if (state1.selectedCard.col !== state2.selectedCard.col) return false
  }

  // Compare isComplete
  if (state1.isComplete !== state2.isComplete) return false

  return true
}

/**
 * Check if two WordCard objects are equal
 */
function areWordCardsEqual(card1: WordCard, card2: WordCard): boolean {
  return (
    card1.id === card2.id &&
    card1.word === card2.word &&
    card1.meaning === card2.meaning &&
    card1.hint === card2.hint &&
    card1.type === card2.type &&
    card1.pairId === card2.pairId &&
    card1.confuse === card2.confuse
  )
}
