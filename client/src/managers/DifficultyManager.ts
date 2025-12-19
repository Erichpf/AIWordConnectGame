/**
 * DifficultyManager - 动态难度调整管理器
 * 
 * Requirements: 7.1, 7.2
 * - 7.1: WHILE a player achieves 3 consecutive correct matches THEN increase visual complexity
 * - 7.2: WHILE a player makes 3 consecutive incorrect attempts THEN provide additional hints
 */

import type { DifficultyAdjustment, DifficultyState } from 'shared'

/**
 * 难度调整触发阈值
 */
export const CONSECUTIVE_THRESHOLD = 3

/**
 * 无操作超时时间（毫秒）
 */
export const INACTIVITY_TIMEOUT = 30000 // 30 seconds

/**
 * 难度调整事件回调类型
 */
export interface DifficultyCallbacks {
  /** 难度增加时调用（减少提示可见性） */
  onDifficultyIncrease?: () => void
  /** 难度降低时调用（提供额外提示） */
  onDifficultyDecrease?: () => void
  /** 无操作超时时调用（高亮有效配对） */
  onInactivityHint?: () => void
}

/**
 * 动态难度调整管理器
 * 负责连续正确/错误检测和难度调整触发逻辑
 */
export class DifficultyManager {
  private state: DifficultyState
  private callbacks: DifficultyCallbacks
  private inactivityTimer: ReturnType<typeof setTimeout> | null

  constructor(callbacks: DifficultyCallbacks = {}) {
    this.state = {
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      lastActionTime: Date.now()
    }
    this.callbacks = callbacks
    this.inactivityTimer = null
  }

  /**
   * 记录一次匹配结果并检查是否需要调整难度
   * @param isCorrect 是否正确匹配
   * @returns 难度调整方向
   */
  recordMatchResult(isCorrect: boolean): DifficultyAdjustment {
    this.updateLastActionTime()
    this.resetInactivityTimer()

    if (isCorrect) {
      return this.handleCorrectMatch()
    } else {
      return this.handleWrongMatch()
    }
  }

  /**
   * 处理正确匹配
   */
  private handleCorrectMatch(): DifficultyAdjustment {
    this.state.consecutiveCorrect++
    this.state.consecutiveWrong = 0

    if (this.state.consecutiveCorrect >= CONSECUTIVE_THRESHOLD) {
      this.state.consecutiveCorrect = 0
      this.callbacks.onDifficultyIncrease?.()
      return 'increase'
    }

    return 'none'
  }

  /**
   * 处理错误匹配
   */
  private handleWrongMatch(): DifficultyAdjustment {
    this.state.consecutiveWrong++
    this.state.consecutiveCorrect = 0

    if (this.state.consecutiveWrong >= CONSECUTIVE_THRESHOLD) {
      this.state.consecutiveWrong = 0
      this.callbacks.onDifficultyDecrease?.()
      return 'decrease'
    }

    return 'none'
  }

  /**
   * 更新最后操作时间
   */
  private updateLastActionTime(): void {
    this.state.lastActionTime = Date.now()
  }

  /**
   * 重置无操作计时器
   */
  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
    }

    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity()
    }, INACTIVITY_TIMEOUT)
  }

  /**
   * 处理无操作超时
   */
  private handleInactivity(): void {
    this.callbacks.onInactivityHint?.()
    // 重新启动计时器
    this.resetInactivityTimer()
  }

  /**
   * 启动无操作检测
   */
  startInactivityDetection(): void {
    this.updateLastActionTime()
    this.resetInactivityTimer()
  }

  /**
   * 停止无操作检测
   */
  stopInactivityDetection(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer)
      this.inactivityTimer = null
    }
  }

  /**
   * 获取当前难度状态
   */
  getState(): DifficultyState {
    return { ...this.state }
  }

  /**
   * 获取连续正确次数
   */
  getConsecutiveCorrect(): number {
    return this.state.consecutiveCorrect
  }

  /**
   * 获取连续错误次数
   */
  getConsecutiveWrong(): number {
    return this.state.consecutiveWrong
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      lastActionTime: Date.now()
    }
    this.stopInactivityDetection()
  }

  /**
   * 从保存的状态恢复
   * @param state 难度状态
   */
  restoreFromState(state: DifficultyState): void {
    this.state = { ...state }
  }

  /**
   * 设置回调函数
   * @param callbacks 回调函数
   */
  setCallbacks(callbacks: DifficultyCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * 检查是否应该触发难度增加
   * @param consecutiveCorrect 连续正确次数
   * @returns 是否应该增加难度
   */
  static shouldIncreaseDifficulty(consecutiveCorrect: number): boolean {
    return consecutiveCorrect >= CONSECUTIVE_THRESHOLD
  }

  /**
   * 检查是否应该触发难度降低
   * @param consecutiveWrong 连续错误次数
   * @returns 是否应该降低难度
   */
  static shouldDecreaseDifficulty(consecutiveWrong: number): boolean {
    return consecutiveWrong >= CONSECUTIVE_THRESHOLD
  }

  /**
   * 根据匹配结果序列计算难度调整
   * @param results 匹配结果序列（true=正确，false=错误）
   * @returns 难度调整方向
   */
  static calculateAdjustmentFromSequence(results: boolean[]): DifficultyAdjustment {
    let consecutiveCorrect = 0
    let consecutiveWrong = 0

    for (const isCorrect of results) {
      if (isCorrect) {
        consecutiveCorrect++
        consecutiveWrong = 0
        if (consecutiveCorrect >= CONSECUTIVE_THRESHOLD) {
          return 'increase'
        }
      } else {
        consecutiveWrong++
        consecutiveCorrect = 0
        if (consecutiveWrong >= CONSECUTIVE_THRESHOLD) {
          return 'decrease'
        }
      }
    }

    return 'none'
  }
}
