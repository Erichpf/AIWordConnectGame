/**
 * GameStatsManager - 游戏统计管理器
 * 
 * Requirements: 6.2
 * - Show statistics including correct matches, incorrect attempts, and time spent
 */

import type { 
  GameScore, 
  MatchRecord, 
  GameResult, 
  GameStats 
} from 'shared'

/**
 * 游戏统计管理器
 * 负责正确/错误计数和时间统计
 */
export class GameStatsManager {
  private score: GameScore
  private matchHistory: MatchRecord[]
  private startTime: number
  private elapsedTime: number
  private isPaused: boolean

  constructor() {
    this.score = { correct: 0, wrong: 0 }
    this.matchHistory = []
    this.startTime = 0
    this.elapsedTime = 0
    this.isPaused = true
  }

  /**
   * 开始计时
   */
  startTimer(): void {
    if (this.isPaused) {
      this.startTime = Date.now() - (this.elapsedTime * 1000)
      this.isPaused = false
    }
  }

  /**
   * 暂停计时
   */
  pauseTimer(): void {
    if (!this.isPaused) {
      this.elapsedTime = this.getElapsedTime()
      this.isPaused = true
    }
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.score = { correct: 0, wrong: 0 }
    this.matchHistory = []
    this.startTime = 0
    this.elapsedTime = 0
    this.isPaused = true
  }

  /**
   * 记录一次匹配结果
   * @param word 词语
   * @param meaning 释义
   * @param isCorrect 是否正确
   */
  recordMatch(word: string, meaning: string, isCorrect: boolean): void {
    const record: MatchRecord = {
      word,
      meaning,
      isCorrect,
      timestamp: Date.now()
    }

    this.matchHistory.push(record)

    if (isCorrect) {
      this.score.correct++
    } else {
      this.score.wrong++
    }
  }

  /**
   * 获取当前分数
   */
  getScore(): GameScore {
    return { ...this.score }
  }

  /**
   * 获取正确匹配数
   */
  getCorrectCount(): number {
    return this.score.correct
  }

  /**
   * 获取错误匹配数
   */
  getWrongCount(): number {
    return this.score.wrong
  }

  /**
   * 获取已用时间（秒）
   */
  getElapsedTime(): number {
    if (this.isPaused) {
      return this.elapsedTime
    }
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  /**
   * 设置已用时间（用于恢复游戏状态）
   * @param seconds 秒数
   */
  setElapsedTime(seconds: number): void {
    this.elapsedTime = seconds
    if (!this.isPaused) {
      this.startTime = Date.now() - (seconds * 1000)
    }
  }

  /**
   * 获取匹配历史
   */
  getMatchHistory(): MatchRecord[] {
    return [...this.matchHistory]
  }

  /**
   * 获取游戏结果
   */
  getGameResult(): GameResult {
    return {
      correct: this.score.correct,
      wrong: this.score.wrong,
      duration: this.getElapsedTime(),
      matchHistory: [...this.matchHistory]
    }
  }

  /**
   * 获取游戏统计（用于 AI 总结）
   */
  getGameStats(): GameStats {
    return {
      correct: this.score.correct,
      wrong: this.score.wrong,
      duration: this.getElapsedTime(),
      matchHistory: [...this.matchHistory]
    }
  }

  /**
   * 从保存的状态恢复
   * @param score 分数
   * @param elapsedTime 已用时间
   * @param matchHistory 匹配历史（可选）
   */
  restoreFromState(
    score: GameScore, 
    elapsedTime: number, 
    matchHistory?: MatchRecord[]
  ): void {
    this.score = { ...score }
    this.elapsedTime = elapsedTime
    this.matchHistory = matchHistory ? [...matchHistory] : []
    this.isPaused = true
  }

  /**
   * 计算正确率
   * @returns 正确率（0-1之间的小数）
   */
  getAccuracy(): number {
    const total = this.score.correct + this.score.wrong
    if (total === 0) return 0
    return this.score.correct / total
  }

  /**
   * 计算平均每次匹配用时（秒）
   */
  getAverageTimePerMatch(): number {
    const total = this.score.correct + this.score.wrong
    if (total === 0) return 0
    return this.getElapsedTime() / total
  }

  /**
   * 从匹配历史计算统计数据
   * 用于验证统计准确性
   * @param history 匹配历史
   * @returns 计算得出的统计
   */
  static calculateStatsFromHistory(history: MatchRecord[]): { correct: number; wrong: number } {
    let correct = 0
    let wrong = 0

    for (const record of history) {
      if (record.isCorrect) {
        correct++
      } else {
        wrong++
      }
    }

    return { correct, wrong }
  }

  /**
   * 验证统计数据与历史记录是否一致
   * @returns 是否一致
   */
  validateStats(): boolean {
    const calculated = GameStatsManager.calculateStatsFromHistory(this.matchHistory)
    return (
      calculated.correct === this.score.correct &&
      calculated.wrong === this.score.wrong
    )
  }
}
