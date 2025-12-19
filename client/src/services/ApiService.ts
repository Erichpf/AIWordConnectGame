/**
 * API 服务层
 * 
 * Requirements: 5.1 - Request word pairs from AI Service based on selected settings
 */

import type { 
  GenerateRequest, 
  GenerateResponse, 
  WordCard,
  GameStats,
  Language,
  Level
} from 'shared'

const API_BASE_URL = '/api'

/**
 * API 服务类
 * 负责与后端 API 通信
 */
export class ApiService {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * 生成词语
   * @param language 语言模式
   * @param level 难度等级
   * @param theme 主题
   * @param count 词对数量
   * @returns 词卡数组
   */
  async generateWords(
    language: Language,
    level: Level,
    theme: string,
    count: number
  ): Promise<WordCard[]> {
    const request: GenerateRequest = {
      language,
      level,
      theme,
      count
    }

    const response = await fetch(`${this.baseUrl}/words/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Failed to generate words: ${response.statusText}`)
    }

    const data: GenerateResponse = await response.json()
    
    if (!data.success) {
      throw new Error('Word generation failed')
    }

    return data.data
  }

  /**
   * 获取 AI 解释
   * @param word 词语
   * @param meaning 释义
   * @param isCorrect 是否匹配正确
   * @returns 解释文本
   */
  async getExplanation(
    word: string,
    meaning: string,
    isCorrect: boolean
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/words/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ word, meaning, isCorrect })
    })

    if (!response.ok) {
      throw new Error(`Failed to get explanation: ${response.statusText}`)
    }

    const data = await response.json()
    return data.explanation || ''
  }

  /**
   * 获取学习总结
   * @param stats 游戏统计
   * @returns 总结文本
   */
  async getSummary(stats: GameStats): Promise<string> {
    const response = await fetch(`${this.baseUrl}/words/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stats })
    })

    if (!response.ok) {
      throw new Error(`Failed to get summary: ${response.statusText}`)
    }

    const data = await response.json()
    return data.summary || ''
  }
}

// 导出单例实例
export const apiService = new ApiService()
