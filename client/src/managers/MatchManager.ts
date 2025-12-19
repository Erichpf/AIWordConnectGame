/**
 * MatchManager - 匹配逻辑管理器
 * 
 * Requirements: 2.4, 4.1, 4.2, 4.5
 * - 2.4: Evaluate whether two selected cards form a valid match
 * - 4.1: Remove both cards on correct match
 * - 4.2: Keep both cards on incorrect match
 * - 4.5: Distinguish between "invalid path" and "content mismatch"
 */

import type { 
  WordCard, 
  Position, 
  BoardState, 
  MatchResult, 
  MatchFailureReason,
  Path 
} from 'shared'
import { PathFinder } from './PathFinder'

/**
 * 匹配管理器
 * 负责卡片匹配判断和路径失败与内容失败的区分
 */
export class MatchManager {
  private pathFinder: PathFinder

  constructor(pathFinder?: PathFinder) {
    this.pathFinder = pathFinder || new PathFinder()
  }

  /**
   * 评估两张卡片是否匹配
   * @param card1 第一张卡片
   * @param card2 第二张卡片
   * @param pos1 第一张卡片位置
   * @param pos2 第二张卡片位置
   * @param board 棋盘状态
   * @returns 匹配结果
   */
  evaluateMatch(
    card1: WordCard,
    card2: WordCard,
    pos1: Position,
    pos2: Position,
    board: BoardState
  ): MatchResult {
    // 首先检查路径是否有效
    const path = this.pathFinder.findPath(pos1, pos2, board)
    
    if (!path) {
      return {
        success: false,
        failureReason: 'invalid_path'
      }
    }

    // 路径有效，检查内容是否匹配
    const contentMatch = this.isContentMatch(card1, card2)
    
    if (!contentMatch) {
      return {
        success: false,
        failureReason: 'content_mismatch',
        path
      }
    }

    // 匹配成功
    return {
      success: true,
      path
    }
  }

  /**
   * 检查两张卡片内容是否匹配
   * 匹配条件：相同的 pairId 且不同的 type（word vs meaning）
   * @param card1 第一张卡片
   * @param card2 第二张卡片
   * @returns 是否匹配
   */
  isContentMatch(card1: WordCard, card2: WordCard): boolean {
    // 必须有相同的 pairId
    if (card1.pairId !== card2.pairId) {
      return false
    }

    // 必须是不同的类型（word 和 meaning）
    if (card1.type === card2.type) {
      return false
    }

    return true
  }

  /**
   * 检查路径是否有效
   * @param pos1 起点位置
   * @param pos2 终点位置
   * @param board 棋盘状态
   * @returns 路径或 null
   */
  checkPath(pos1: Position, pos2: Position, board: BoardState): Path | null {
    return this.pathFinder.findPath(pos1, pos2, board)
  }

  /**
   * 获取匹配失败的原因描述
   * @param reason 失败原因
   * @returns 描述文本
   */
  getFailureMessage(reason: MatchFailureReason): string {
    switch (reason) {
      case 'invalid_path':
        return '无法连接：两张卡片之间没有有效路径'
      case 'content_mismatch':
        return '匹配错误：这两张卡片不是一对'
      default:
        return '未知错误'
    }
  }

  /**
   * 获取匹配失败的英文原因描述
   * @param reason 失败原因
   * @returns 描述文本
   */
  getFailureMessageEn(reason: MatchFailureReason): string {
    switch (reason) {
      case 'invalid_path':
        return 'No valid path: Cannot connect these two cards'
      case 'content_mismatch':
        return 'Mismatch: These cards are not a pair'
      default:
        return 'Unknown error'
    }
  }
}
