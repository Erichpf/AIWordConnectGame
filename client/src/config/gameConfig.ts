/**
 * 游戏配置和难度映射
 * 
 * Requirements: 1.3 - Difficulty level to board size mapping
 * - easy: 4×4
 * - medium: 6×6  
 * - hard: 8×8
 */

import type { Level, BoardSize, GameConfig, Language } from 'shared'

/**
 * 难度到棋盘尺寸的映射
 * Property 1: Difficulty-to-Board-Size Mapping
 */
export const DIFFICULTY_BOARD_SIZE_MAP: Record<Level, BoardSize> = {
  easy: { rows: 4, cols: 4 },
  medium: { rows: 6, cols: 6 },
  hard: { rows: 8, cols: 8 }
}

/**
 * 根据难度获取棋盘尺寸
 * @param level 难度等级
 * @returns 棋盘尺寸
 */
export function getBoardSizeByDifficulty(level: Level): BoardSize {
  return DIFFICULTY_BOARD_SIZE_MAP[level]
}

/**
 * 计算棋盘需要的词对数量
 * @param boardSize 棋盘尺寸
 * @returns 词对数量
 */
export function getPairCount(boardSize: BoardSize): number {
  return (boardSize.rows * boardSize.cols) / 2
}

/**
 * 可用主题列表
 */
export const AVAILABLE_THEMES = [
  'learning',   // 学习
  'virtue',     // 品德
  'growth',     // 成长
  'technology'  // 科技
] as const

export type Theme = typeof AVAILABLE_THEMES[number]

/**
 * 创建默认游戏配置
 */
export function createDefaultGameConfig(): GameConfig {
  const level: Level = 'easy'
  return {
    language: 'zh',
    level,
    theme: 'learning',
    boardSize: getBoardSizeByDifficulty(level)
  }
}

/**
 * 创建游戏配置
 * @param language 语言模式
 * @param level 难度等级
 * @param theme 主题
 * @returns 游戏配置
 */
export function createGameConfig(
  language: Language,
  level: Level,
  theme: string
): GameConfig {
  return {
    language,
    level,
    theme,
    boardSize: getBoardSizeByDifficulty(level)
  }
}
