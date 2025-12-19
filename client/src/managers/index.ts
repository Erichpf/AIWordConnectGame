/**
 * Managers - 游戏管理器模块
 */

export { BoardManager } from './BoardManager'
export { PathFinder } from './PathFinder'
export { MatchManager } from './MatchManager'
export { GameStatsManager } from './GameStatsManager'
export { DifficultyManager, CONSECUTIVE_THRESHOLD, INACTIVITY_TIMEOUT } from './DifficultyManager'
export type { DifficultyCallbacks } from './DifficultyManager'
export { CardManager, CARD_WIDTH, CARD_HEIGHT, CARD_PADDING, CARD_COLORS } from './CardManager'
export type { CardSprite } from './CardManager'
