/**
 * AI Service Module
 * Requirements: 8.2, 8.3, 8.4
 * Handles AI content generation with retry and fallback logic
 * Using GLM API via OpenAI SDK
 */

import OpenAI from 'openai'
import { WordCard, Language, Level, GameStats } from 'shared'

interface GenerateParams {
  language: Language
  level: Level
  theme: string
  count: number
}

interface AIGenerateResult {
  success: boolean
  data: WordCard[]
  error?: string
}

interface AIWordResponse {
  word: string
  meaning: string
  hint: string
  confuse?: string
}

export class AIService {
  private client: OpenAI | null = null
  private model: string
  private maxRetries: number = 1

  constructor() {
    const apiKey = process.env.AI_API_KEY || 'sk-6e734e8eb7d04f5e9a6293c254f6ee76'
    const baseURL = process.env.AI_API_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    this.model = process.env.AI_MODEL || 'glm-4.6'

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL
      })
    }
  }

  /**
   * Generate word content using AI
   * Requirements: 8.2, 8.3, 8.4
   */
  async generateContent(params: GenerateParams): Promise<AIGenerateResult> {
    if (!this.client) {
      return { success: false, data: [], error: 'AI API key not configured' }
    }

    let lastError: string = ''
    
    // Try with retry logic (Requirements: 8.4)
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const prompt = this.buildPrompt(params)
        const response = await this.callAI(prompt)
        const words = this.parseResponse(response, params.count)
        
        if (words.length > 0) {
          return { success: true, data: words }
        }
        
        lastError = 'Empty response from AI'
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.error(`AI generation attempt ${attempt + 1} failed:`, lastError)
      }
    }

    return { success: false, data: [], error: lastError }
  }

  /**
   * Build prompt for AI model
   * Requirements: 8.2
   */
  buildPrompt(params: GenerateParams): string {
    const { language, level, theme, count } = params
    
    const levelDescriptions: Record<Level, string> = {
      easy: '简单/常见',
      medium: '中等难度',
      hard: '较难/不常见'
    }

    if (language === 'zh') {
      return `请生成${count}个关于"${theme}"主题的中文成语，难度为${levelDescriptions[level]}。

要求：
1. 每个成语包含：word(成语)、meaning(释义)、hint(文化背景或典故)、confuse(易混淆的成语，可选)
2. 返回JSON数组格式
3. 确保成语与主题相关
4. hint字段要包含文化背景信息

返回格式示例：
[
  {"word": "学而不厌", "meaning": "学习而不感到满足", "hint": "出自《论语》，孔子形容好学的态度", "confuse": "诲人不倦"}
]

请直接返回JSON数组，不要包含其他文字。`
    } else {
      return `Please generate ${count} English vocabulary words about "${theme}" theme, difficulty level: ${level}.

Requirements:
1. Each word should include: word, meaning, hint (with example sentence), confuse (similar word, optional)
2. Return as JSON array
3. Ensure words are relevant to the theme
4. hint field should contain an example sentence

Return format example:
[
  {"word": "acquire", "meaning": "to gain knowledge or skill", "hint": "Example: She acquired fluency in French.", "confuse": "obtain"}
]

Please return only the JSON array, no other text.`
    }
  }

  /**
   * Call AI API using OpenAI SDK
   */
  private async callAI(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error('AI client not initialized')
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that generates educational word content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    return completion.choices?.[0]?.message?.content || ''
  }

  /**
   * Parse AI response to WordCard array
   * Requirements: 8.3
   */
  parseResponse(response: string, expectedCount: number): WordCard[] {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim()
    
    // Remove markdown code block if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim()
    }

    // Try to find JSON array in the response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      jsonStr = arrayMatch[0]
    }

    let parsed: AIWordResponse[]
    try {
      parsed = JSON.parse(jsonStr)
    } catch (error) {
      throw new Error(`Failed to parse AI response as JSON: ${error}`)
    }

    if (!Array.isArray(parsed)) {
      throw new Error('AI response is not an array')
    }

    // Validate and convert to WordCard pairs
    const cards: WordCard[] = []
    
    for (let i = 0; i < parsed.length && cards.length < expectedCount * 2; i++) {
      const item = parsed[i]
      
      if (!this.isValidWordResponse(item)) {
        console.warn('Invalid word entry, skipping:', item)
        continue
      }

      const pairId = `ai_pair_${i}_${Date.now()}`
      
      // Word card
      cards.push({
        id: `word_${pairId}`,
        word: item.word,
        meaning: item.meaning,
        hint: item.hint,
        confuse: item.confuse,
        type: 'word',
        pairId
      })

      // Meaning card
      cards.push({
        id: `meaning_${pairId}`,
        word: item.word,
        meaning: item.meaning,
        hint: item.hint,
        confuse: item.confuse,
        type: 'meaning',
        pairId
      })
    }

    return cards
  }

  /**
   * Validate word response structure
   */
  private isValidWordResponse(item: unknown): item is AIWordResponse {
    if (!item || typeof item !== 'object') return false
    const obj = item as Record<string, unknown>
    return (
      typeof obj.word === 'string' && obj.word.length > 0 &&
      typeof obj.meaning === 'string' && obj.meaning.length > 0 &&
      typeof obj.hint === 'string' && obj.hint.length > 0
    )
  }

  /**
   * Generate explanation for a word pair
   */
  async generateExplanation(word: string, meaning: string, isCorrect: boolean): Promise<string> {
    if (!this.client) {
      return isCorrect 
        ? `正确！"${word}"的意思是：${meaning}` 
        : `"${word}"的正确释义是：${meaning}`
    }

    try {
      const prompt = isCorrect
        ? `请简短解释"${word}"（${meaning}）的用法和文化背景，50字以内。`
        : `用户将"${word}"与错误的释义匹配了。请简短解释"${word}"的正确含义（${meaning}），并给出记忆技巧，80字以内。`

      const response = await this.callAI(prompt)
      return response.trim() || (isCorrect ? `${word}: ${meaning}` : `正确答案：${meaning}`)
    } catch (error) {
      return isCorrect 
        ? `正确！"${word}"的意思是：${meaning}` 
        : `"${word}"的正确释义是：${meaning}`
    }
  }

  /**
   * Generate learning summary
   */
  async generateSummary(stats: GameStats): Promise<string> {
    if (!this.client) {
      return this.generateLocalSummary(stats)
    }

    try {
      const wordsLearned = stats.matchHistory
        .filter((m) => m.isCorrect)
        .map((m) => m.word)
        .join('、')

      const prompt = `用户完成了词语学习游戏：
- 正确匹配：${stats.correct}次
- 错误尝试：${stats.wrong}次
- 用时：${Math.floor(stats.duration / 60)}分${stats.duration % 60}秒
- 学习的词语：${wordsLearned || '无'}

请生成一段简短的学习总结和建议，100字以内，语气鼓励积极。`

      const response = await this.callAI(prompt)
      return response.trim() || this.generateLocalSummary(stats)
    } catch (error) {
      return this.generateLocalSummary(stats)
    }
  }

  /**
   * Generate local summary without AI
   */
  private generateLocalSummary(stats: GameStats): string {
    const accuracy = stats.correct + stats.wrong > 0 
      ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) 
      : 0
    
    const minutes = Math.floor(stats.duration / 60)
    const seconds = stats.duration % 60

    let message = `游戏完成！\n`
    message += `正确匹配：${stats.correct}次\n`
    message += `错误尝试：${stats.wrong}次\n`
    message += `正确率：${accuracy}%\n`
    message += `用时：${minutes}分${seconds}秒\n\n`

    if (accuracy >= 80) {
      message += '太棒了！你的词汇掌握得很好，继续保持！'
    } else if (accuracy >= 60) {
      message += '不错的表现！多加练习，你会更加熟练的。'
    } else {
      message += '继续努力！每次练习都是进步的机会。'
    }

    return message
  }
}
