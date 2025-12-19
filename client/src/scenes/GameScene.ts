/**
 * GameScene - 游戏主场景
 * 
 * Requirements: 2.1, 2.3, 3.6
 * - 2.1: Display a board with WordCards arranged in a grid matching the selected difficulty size
 * - 2.3: Highlight the selected card visually
 * - 3.6: Animate the connection line before removing the cards
 */

import Phaser from 'phaser'
import type { 
  GameConfig, 
  Path,
  GameState,
  MatchRecord,
  Position,
  BoardState,
  WordCard
} from 'shared'
import { BoardManager } from '../managers/BoardManager'
import { PathFinder } from '../managers/PathFinder'
import { MatchManager } from '../managers/MatchManager'
import { GameStatsManager } from '../managers/GameStatsManager'
import { DifficultyManager } from '../managers/DifficultyManager'
import { CardManager, CARD_WIDTH, CARD_HEIGHT, CARD_PADDING } from '../managers/CardManager'
import type { CardSprite } from '../managers/CardManager'
import { apiService } from '../services/ApiService'
import { getPairCount } from '../config/gameConfig'

export class GameScene extends Phaser.Scene {
  private config!: GameConfig
  private boardManager!: BoardManager
  private pathFinder!: PathFinder
  private matchManager!: MatchManager
  private statsManager!: GameStatsManager
  private difficultyManager!: DifficultyManager
  private cardManager!: CardManager
  
  private selectedCard: CardSprite | null = null
  private pathGraphics!: Phaser.GameObjects.Graphics
  
  private boardOffsetX: number = 0
  private boardOffsetY: number = 0
  
  private isProcessing: boolean = false
  private matchHistory: MatchRecord[] = []
  private startTime: number = 0
  
  // UI elements
  private scoreText!: Phaser.GameObjects.Text
  private timerText!: Phaser.GameObjects.Text
  private timerEvent!: Phaser.Time.TimerEvent
  
  // Stats tracking
  private correctCount: number = 0
  private wrongCount: number = 0

  constructor() {
    super({ key: 'GameScene' })
  }

  init(data: { config?: GameConfig }): void {
    // Get config from passed data or registry
    this.config = data.config || this.registry.get('gameConfig')
    
    // Initialize managers
    this.boardManager = new BoardManager()
    this.pathFinder = new PathFinder()
    this.matchManager = new MatchManager(this.pathFinder)
    this.statsManager = new GameStatsManager()
    this.cardManager = new CardManager(this)
    
    // Initialize DifficultyManager with callbacks (Requirements: 7.1, 7.2, 7.3)
    this.difficultyManager = new DifficultyManager({
      onDifficultyIncrease: () => this.onDifficultyIncrease(),
      onDifficultyDecrease: () => this.onDifficultyDecrease(),
      onInactivityHint: () => this.highlightHintPair()
    })
    
    // Reset state
    this.selectedCard = null
    this.isProcessing = false
    this.matchHistory = []
    this.correctCount = 0
    this.wrongCount = 0
  }

  async create(): Promise<void> {
    // Create path graphics layer (behind cards)
    this.pathGraphics = this.add.graphics()
    
    // Create UI
    this.createUI()
    
    // Show loading with spinner animation
    const loadingContainer = this.createLoadingIndicator()
    
    try {
      // Fetch words from API
      const pairCount = getPairCount(this.config.boardSize)
      const words = await apiService.generateWords(
        this.config.language,
        this.config.level,
        this.config.theme,
        pairCount
      )
      
      // Destroy loading indicator
      loadingContainer.destroy()
      
      // Initialize board
      this.boardManager.initBoard(
        this.config.boardSize.rows,
        this.config.boardSize.cols,
        words
      )
      
      // Calculate board offset to center it
      this.calculateBoardOffset()
      
      // Render board
      this.renderBoard()
      
      // Start timer
      this.startTime = Date.now()
      this.startTimer()
      
      // Start inactivity detection (Requirements: 7.3)
      this.difficultyManager.startInactivityDetection()
      
    } catch (error) {
      loadingContainer.destroy()
      console.error('Failed to load game:', error)
      
      // Show error message with retry option
      this.showErrorMessage('加载失败，请检查网络连接')
    }
  }

  /**
   * Create loading indicator with spinner animation
   * Requirements: 4.4 - Loading state indication
   */
  private createLoadingIndicator(): Phaser.GameObjects.Container {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    const container = this.add.container(width / 2, height / 2)
    
    // Background overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.5)
    
    // Loading box
    const box = this.add.rectangle(0, 0, 200, 120, 0x1a1a2e, 0.95)
    box.setStrokeStyle(2, 0x4a90d9)
    
    // Spinner dots
    const dots: Phaser.GameObjects.Arc[] = []
    const dotCount = 3
    const dotRadius = 6
    const dotSpacing = 20
    
    for (let i = 0; i < dotCount; i++) {
      const dot = this.add.circle(
        (i - 1) * dotSpacing, 
        -15, 
        dotRadius, 
        0x4a90d9
      )
      dots.push(dot)
      container.add(dot)
    }
    
    // Animate dots
    dots.forEach((dot, index) => {
      this.tweens.add({
        targets: dot,
        y: -25,
        duration: 400,
        delay: index * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    })
    
    // Loading text
    const text = this.add.text(0, 25, '正在加载词库...', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    container.add([overlay, box, text])
    container.setDepth(100)
    
    return container
  }

  /**
   * Show error message with retry button
   * Requirements: 4.4 - Error prompts
   */
  private showErrorMessage(message: string): void {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    const container = this.add.container(width / 2, height / 2)
    
    // Error box
    const box = this.add.rectangle(0, 0, 280, 150, 0x2d1a1a, 0.95)
    box.setStrokeStyle(2, 0xff6b6b)
    
    // Error icon
    const icon = this.add.text(0, -45, '⚠️', {
      fontSize: '32px'
    }).setOrigin(0.5)
    
    // Error message
    const text = this.add.text(0, 0, message, {
      fontSize: '14px',
      color: '#ff6b6b',
      wordWrap: { width: 240 },
      align: 'center'
    }).setOrigin(0.5)
    
    // Retry button
    const retryBtn = this.add.container(0, 50)
    const btnBg = this.add.rectangle(0, 0, 100, 35, 0x4a90d9)
    btnBg.setStrokeStyle(1, 0xffffff)
    const btnText = this.add.text(0, 0, '重试', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    retryBtn.add([btnBg, btnText])
    retryBtn.setSize(100, 35)
    retryBtn.setInteractive({ useHandCursor: true })
    
    retryBtn.on('pointerover', () => btnBg.setFillStyle(0x6bb3f0))
    retryBtn.on('pointerout', () => btnBg.setFillStyle(0x4a90d9))
    retryBtn.on('pointerdown', () => {
      container.destroy()
      this.scene.restart({ config: this.config })
    })
    
    container.add([box, icon, text, retryBtn])
    container.setAlpha(0)
    
    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    })
  }

  private createUI(): void {
    const width = this.cameras.main.width
    
    // Title
    this.add.text(width / 2, 20, '智连词境', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Score display
    this.scoreText = this.add.text(20, 20, '正确: 0 | 错误: 0', {
      fontSize: '16px',
      color: '#ffffff'
    })
    
    // Timer display
    this.timerText = this.add.text(width - 20, 20, '00:00', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(1, 0)
    
    // Back button
    const backBtn = this.add.text(20, 560, '← 返回菜单', {
      fontSize: '14px',
      color: '#aaaaaa'
    }).setInteractive({ useHandCursor: true })
    
    backBtn.on('pointerover', () => backBtn.setColor('#ffffff'))
    backBtn.on('pointerout', () => backBtn.setColor('#aaaaaa'))
    backBtn.on('pointerdown', () => this.returnToMenu())
  }

  private calculateBoardOffset(): void {
    const { rows, cols } = this.config.boardSize
    const boardWidth = cols * (CARD_WIDTH + CARD_PADDING) - CARD_PADDING
    const boardHeight = rows * (CARD_HEIGHT + CARD_PADDING) - CARD_PADDING
    
    this.boardOffsetX = (this.cameras.main.width - boardWidth) / 2
    this.boardOffsetY = (this.cameras.main.height - boardHeight) / 2 + 20
    
    // Set offset in CardManager
    this.cardManager.setBoardOffset(this.boardOffsetX, this.boardOffsetY)
  }

  private renderBoard(): void {
    const { rows, cols } = this.config.boardSize
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const card = this.boardManager.getCardAt(row, col)
        if (card) {
          const position = { row, col }
          const cardSprite = this.cardManager.createCardSprite(
            card, 
            position,
            (cs) => this.onCardClick(cs)
          )
          // Play entry animation with staggered delay
          const delay = (row * cols + col) * 30
          this.cardManager.playEntryAnimation(cardSprite, delay)
        }
      }
    }
  }

  private onCardClick(card: CardSprite): void {
    if (this.isProcessing) return
    
    // If clicking the same card, deselect it
    if (this.selectedCard === card) {
      this.cardManager.deselectCard(card)
      this.selectedCard = null
      return
    }
    
    // If no card selected, select this one
    if (!this.selectedCard) {
      this.cardManager.selectCard(card)
      this.selectedCard = card
      return
    }
    
    // Two cards selected - evaluate match
    this.evaluateMatch(this.selectedCard, card)
  }

  private async evaluateMatch(card1: CardSprite, card2: CardSprite): Promise<void> {
    this.isProcessing = true
    
    // Select the second card visually
    this.cardManager.selectCard(card2)
    
    // Get board state and evaluate
    const boardState = this.boardManager.getBoardState()
    const result = this.matchManager.evaluateMatch(
      card1.cardData,
      card2.cardData,
      card1.position,
      card2.position,
      boardState
    )
    
    // Record match
    const record: MatchRecord = {
      word: card1.cardData.word,
      meaning: card1.cardData.type === 'meaning' ? card1.cardData.meaning : card2.cardData.meaning,
      isCorrect: result.success,
      timestamp: Date.now()
    }
    this.matchHistory.push(record)
    
    // Update stats
    if (result.success) {
      this.correctCount++
    } else {
      this.wrongCount++
    }
    this.statsManager.recordMatch(card1.cardData.word, card1.cardData.meaning, result.success)
    this.difficultyManager.recordMatchResult(result.success)
    this.updateScoreDisplay()
    
    if (result.success && result.path) {
      // Successful match - animate path and remove cards
      await this.animateSuccessfulMatch(card1, card2, result.path)
      
      // Remove cards from board
      this.boardManager.removeCardPair(card1.position, card2.position)
      
      // Check for game completion
      if (this.boardManager.isGameComplete()) {
        this.onGameComplete()
      }
    } else {
      // Failed match - show error feedback
      await this.animateFailedMatch(card1, card2, result.failureReason)
    }
    
    // Reset selection
    this.selectedCard = null
    this.isProcessing = false
  }

  private async animateSuccessfulMatch(
    card1: CardSprite, 
    card2: CardSprite, 
    path: Path
  ): Promise<void> {
    // Draw path animation
    await this.animatePath(path)
    
    // Flash success effect
    await this.cardManager.playSuccessFlash(card1, card2)
    
    // Wait a bit
    await this.delay(100)
    
    // Remove cards with animation
    await this.cardManager.removeCardsWithAnimation(card1, card2)
    
    // Clear path
    this.pathGraphics.clear()
    
    // Fetch and show AI explanation (Requirements: 4.3, 4.4)
    this.fetchAndShowExplanation(card1.cardData.word, card1.cardData.meaning, true)
  }

  private async animatePath(path: Path): Promise<void> {
    const simplifiedPath = this.pathFinder.simplifyPath(path)
    const points = simplifiedPath.points.map(p => this.cardManager.gridToScreen(p))
    
    this.pathGraphics.clear()
    this.pathGraphics.lineStyle(4, 0xffd700, 1)
    
    // Animate drawing the path
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i]
      const end = points[i + 1]
      
      await this.animateLineSegment(start, end)
    }
  }

  private async animateLineSegment(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): Promise<void> {
    return new Promise(resolve => {
      const duration = 150
      const startTime = this.time.now
      
      const drawLine = () => {
        const elapsed = this.time.now - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        const currentX = start.x + (end.x - start.x) * progress
        const currentY = start.y + (end.y - start.y) * progress
        
        // Redraw all previous segments plus current
        this.pathGraphics.lineBetween(start.x, start.y, currentX, currentY)
        
        if (progress < 1) {
          this.time.delayedCall(16, drawLine)
        } else {
          resolve()
        }
      }
      
      drawLine()
    })
  }

  private async animateFailedMatch(
    card1: CardSprite,
    card2: CardSprite,
    reason?: string
  ): Promise<void> {
    // Play error shake animation using CardManager
    await this.cardManager.playErrorShake(card1, card2)
    
    // Show error message
    const message = reason === 'invalid_path' 
      ? '无法连接' 
      : '不匹配'
    
    const errorText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      message,
      { fontSize: '20px', color: '#ff4444', fontStyle: 'bold' }
    ).setOrigin(0.5)
    
    await this.delay(300)
    
    // Restore card colors
    this.cardManager.deselectCard(card1)
    this.cardManager.deselectCard(card2)
    
    // Fade out error message
    this.tweens.add({
      targets: errorText,
      alpha: 0,
      duration: 300,
      onComplete: () => errorText.destroy()
    })
    
    // Show AI explanation for content mismatch (Requirements: 4.4)
    if (reason === 'content_mismatch') {
      // Get the word card's correct meaning
      const wordCard = card1.cardData.type === 'word' ? card1.cardData : card2.cardData
      this.fetchAndShowExplanation(wordCard.word, wordCard.meaning, false)
    }
  }

  private updateScoreDisplay(): void {
    this.scoreText.setText(`正确: ${this.correctCount} | 错误: ${this.wrongCount}`)
  }

  private startTimer(): void {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    })
  }

  private updateTimer(): void {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    this.timerText.setText(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    )
  }

  /**
   * Handle game completion
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   * - 6.1: Display game completion screen when all cards are cleared
   * - 6.2: Show statistics including correct matches, incorrect attempts, and time spent
   * - 6.3: Request AI-generated learning summary based on game performance
   * - 6.4: Display personalized review suggestions
   * - 6.5: Offer options to replay or return to settings
   */
  private async onGameComplete(): Promise<void> {
    // Stop timer
    if (this.timerEvent) {
      this.timerEvent.destroy()
    }
    
    // Stop inactivity detection
    this.difficultyManager.stopInactivityDetection()
    
    const duration = Math.floor((Date.now() - this.startTime) / 1000)
    
    // Store game result
    const gameResult = {
      correct: this.correctCount,
      wrong: this.wrongCount,
      duration,
      matchHistory: this.matchHistory
    }
    
    this.registry.set('gameResult', gameResult)
    
    // Show completion overlay
    this.showGameEndScreen(duration)
  }

  /**
   * Display the game end screen with statistics and AI summary
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
   */
  private async showGameEndScreen(duration: number): Promise<void> {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Create overlay
    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
    )
    overlay.setAlpha(0)
    
    // Create panel background
    const panelWidth = 400
    const panelHeight = 450
    const panel = this.add.rectangle(
      width / 2,
      height / 2,
      panelWidth,
      panelHeight,
      0x1a1a2e,
      1
    )
    panel.setStrokeStyle(3, 0x4a90d9)
    panel.setAlpha(0)
    
    // Title
    const titleText = this.add.text(
      width / 2,
      height / 2 - 190,
      '🎉 游戏完成！',
      { fontSize: '28px', color: '#ffd700', fontStyle: 'bold' }
    ).setOrigin(0.5).setAlpha(0)
    
    // Statistics section (Requirements: 6.2)
    const accuracy = this.correctCount + this.wrongCount > 0 
      ? Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100) 
      : 0
    
    const statsY = height / 2 - 120
    const statsContainer = this.add.container(width / 2, statsY)
    
    // Stats header
    const statsHeader = this.add.text(0, 0, '📊 游戏统计', {
      fontSize: '18px',
      color: '#4a90d9',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Stats grid
    const statsGrid = [
      { label: '✓ 正确匹配', value: `${this.correctCount}`, color: '#50c878' },
      { label: '✗ 错误尝试', value: `${this.wrongCount}`, color: '#ff6b6b' },
      { label: '⏱ 用时', value: this.formatTime(duration), color: '#ffffff' },
      { label: '📈 正确率', value: `${accuracy}%`, color: '#ffd700' }
    ]
    
    const gridStartY = 35
    statsGrid.forEach((stat, index) => {
      const y = gridStartY + index * 28
      const labelText = this.add.text(-80, y, stat.label, {
        fontSize: '14px',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5)
      
      const valueText = this.add.text(80, y, stat.value, {
        fontSize: '14px',
        color: stat.color,
        fontStyle: 'bold'
      }).setOrigin(1, 0.5)
      
      statsContainer.add([labelText, valueText])
    })
    
    statsContainer.add(statsHeader)
    statsContainer.setAlpha(0)
    
    // AI Summary section (Requirements: 6.3, 6.4)
    const summaryY = height / 2 + 30
    const summaryHeader = this.add.text(
      width / 2,
      summaryY,
      '🤖 AI 学习建议',
      { fontSize: '18px', color: '#4a90d9', fontStyle: 'bold' }
    ).setOrigin(0.5).setAlpha(0)
    
    // Loading text for AI summary
    const summaryText = this.add.text(
      width / 2,
      summaryY + 50,
      '正在生成学习建议...',
      { 
        fontSize: '13px', 
        color: '#cccccc',
        wordWrap: { width: panelWidth - 60 },
        align: 'center'
      }
    ).setOrigin(0.5, 0).setAlpha(0)
    
    // Buttons (Requirements: 6.5)
    const buttonY = height / 2 + 175
    
    const replayBtn = this.createEndScreenButton(
      width / 2 - 90,
      buttonY,
      '🔄 再玩一次',
      0x50c878,
      () => this.scene.restart({ config: this.config })
    )
    replayBtn.setAlpha(0)
    
    const menuBtn = this.createEndScreenButton(
      width / 2 + 90,
      buttonY,
      '🏠 返回菜单',
      0x4a90d9,
      () => this.returnToMenu()
    )
    menuBtn.setAlpha(0)
    
    // Animate elements in
    const elements = [overlay, panel, titleText, statsContainer, summaryHeader, summaryText, replayBtn, menuBtn]
    
    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 400,
      delay: 200,
      ease: 'Power2'
    })
    
    // Fetch AI summary (Requirements: 6.3)
    this.fetchAndDisplaySummary(summaryText)
  }

  /**
   * Fetch AI summary and update the display
   * Requirements: 6.3, 6.4
   */
  private async fetchAndDisplaySummary(summaryText: Phaser.GameObjects.Text): Promise<void> {
    try {
      const gameStats = {
        correct: this.correctCount,
        wrong: this.wrongCount,
        duration: Math.floor((Date.now() - this.startTime) / 1000),
        matchHistory: this.matchHistory
      }
      
      const summary = await apiService.getSummary(gameStats)
      
      // Update summary text with AI response
      summaryText.setText(summary || this.getDefaultSummary())
      
    } catch (error) {
      console.error('Failed to fetch AI summary:', error)
      // Show default summary on error
      summaryText.setText(this.getDefaultSummary())
    }
  }

  /**
   * Generate a default summary when AI is unavailable
   */
  private getDefaultSummary(): string {
    const accuracy = this.correctCount + this.wrongCount > 0 
      ? Math.round((this.correctCount / (this.correctCount + this.wrongCount)) * 100) 
      : 0
    
    if (accuracy >= 90) {
      return '太棒了！你的表现非常出色，词汇掌握得很好。继续保持！'
    } else if (accuracy >= 70) {
      return '做得不错！大部分词汇你都掌握了，可以尝试更高难度挑战自己。'
    } else if (accuracy >= 50) {
      return '继续加油！建议多复习错误的词汇，加深记忆。'
    } else {
      return '别灰心！学习需要时间，建议从简单难度开始，逐步提升。'
    }
  }

  /**
   * Create a styled button for the end screen
   */
  private createEndScreenButton(
    x: number,
    y: number,
    text: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y)
    
    const bg = this.add.rectangle(0, 0, 150, 45, color)
    bg.setStrokeStyle(2, 0xffffff)
    
    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    container.add([bg, label])
    container.setSize(150, 45)
    container.setInteractive({ useHandCursor: true })
    
    // Hover effects
    container.on('pointerover', () => {
      bg.setFillStyle(this.lightenColor(color))
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 100
      })
    })
    
    container.on('pointerout', () => {
      bg.setFillStyle(color)
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100
      })
    })
    
    container.on('pointerdown', onClick)
    
    return container
  }

  /**
   * Lighten a color for hover effect
   */
  private lightenColor(color: number): number {
    const r = Math.min(255, ((color >> 16) & 0xff) + 30)
    const g = Math.min(255, ((color >> 8) & 0xff) + 30)
    const b = Math.min(255, (color & 0xff) + 30)
    return (r << 16) | (g << 8) | b
  }



  /**
   * Show a toast notification
   * Requirements: 4.4 - Non-intrusive feedback
   */
  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const width = this.cameras.main.width
    
    const colors = {
      success: { bg: 0x2d5a3d, border: 0x50c878 },
      error: { bg: 0x5a2d2d, border: 0xff6b6b },
      info: { bg: 0x1a1a2e, border: 0x4a90d9 }
    }
    
    const color = colors[type]
    
    const container = this.add.container(width / 2, 80)
    
    const bg = this.add.rectangle(0, 0, 250, 40, color.bg, 0.95)
    bg.setStrokeStyle(2, color.border)
    
    const text = this.add.text(0, 0, message, {
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    container.add([bg, text])
    container.setAlpha(0)
    container.setDepth(500)
    
    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: 70,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        // Auto-hide after 2 seconds
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            y: 60,
            duration: 200,
            onComplete: () => container.destroy()
          })
        })
      }
    })
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private returnToMenu(): void {
    if (this.timerEvent) {
      this.timerEvent.destroy()
    }
    // Stop inactivity detection
    this.difficultyManager.stopInactivityDetection()
    this.scene.start('MenuScene')
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(ms, resolve)
    })
  }

  /**
   * Fetch and display AI explanation for a word pair
   * Requirements: 4.3, 4.4
   */
  private async fetchAndShowExplanation(
    word: string, 
    meaning: string, 
    isCorrect: boolean
  ): Promise<void> {
    try {
      const explanation = await apiService.getExplanation(word, meaning, isCorrect)
      if (explanation) {
        this.showExplanationTooltip(word, explanation, isCorrect)
      }
    } catch (error) {
      console.error('Failed to fetch explanation:', error)
      // Show default explanation on error
      const defaultExplanation = isCorrect 
        ? `${word}: ${meaning}` 
        : `正确答案：${meaning}`
      this.showExplanationTooltip(word, defaultExplanation, isCorrect)
    }
  }

  /**
   * Show explanation tooltip
   * Requirements: 4.4
   */
  private showExplanationTooltip(
    word: string, 
    explanation: string, 
    isCorrect: boolean
  ): void {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Create tooltip container
    const tooltipWidth = 320
    const tooltipHeight = 100
    const tooltipX = width / 2
    const tooltipY = height - 80
    
    const container = this.add.container(tooltipX, tooltipY)
    
    // Background
    const bg = this.add.rectangle(
      0, 0, 
      tooltipWidth, tooltipHeight, 
      isCorrect ? 0x2d5a3d : 0x5a2d2d, 
      0.95
    )
    bg.setStrokeStyle(2, isCorrect ? 0x50c878 : 0xff6b6b)
    
    // Icon
    const icon = this.add.text(-tooltipWidth/2 + 15, -tooltipHeight/2 + 12, 
      isCorrect ? '✓' : '✗', 
      { fontSize: '18px', color: isCorrect ? '#50c878' : '#ff6b6b' }
    )
    
    // Word title
    const title = this.add.text(-tooltipWidth/2 + 40, -tooltipHeight/2 + 10, word, {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    
    // Explanation text
    const text = this.add.text(0, 5, explanation, {
      fontSize: '12px',
      color: '#cccccc',
      wordWrap: { width: tooltipWidth - 30 },
      align: 'center'
    }).setOrigin(0.5, 0)
    
    container.add([bg, icon, title, text])
    container.setAlpha(0)
    container.setDepth(1000)
    
    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: tooltipY - 10,
      duration: 200,
      ease: 'Power2'
    })
    
    // Auto-hide after 3 seconds
    this.time.delayedCall(3000, () => {
      this.tweens.add({
        targets: container,
        alpha: 0,
        y: tooltipY + 10,
        duration: 200,
        onComplete: () => container.destroy()
      })
    })
  }

  /**
   * Handle difficulty increase (3 consecutive correct)
   * Requirements: 7.1
   */
  private onDifficultyIncrease(): void {
    this.showToast('🔥 连续正确！继续保持', 'success')
  }

  /**
   * Handle difficulty decrease (3 consecutive wrong)
   * Requirements: 7.2
   */
  private onDifficultyDecrease(): void {
    this.showToast('💡 提示：高亮显示一对匹配', 'info')
    // Highlight a valid pair
    this.highlightHintPair()
  }

  /**
   * Highlight a valid pair as hint
   * Requirements: 7.3
   */
  private highlightHintPair(): void {
    const boardState = this.boardManager.getBoardState()
    const validPair = this.findValidPair(boardState)
    
    if (validPair) {
      const card1 = this.cardManager.getCardSpriteAt(validPair.pos1)
      const card2 = this.cardManager.getCardSpriteAt(validPair.pos2)
      
      if (card1 && card2) {
        // Pulse animation for hint
        this.tweens.add({
          targets: [card1.container, card2.container],
          scale: 1.15,
          duration: 300,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut'
        })
        
        // Temporary glow effect
        const originalColor1 = card1.cardData.type === 'word' ? 0x4a90d9 : 0x50c878
        const originalColor2 = card2.cardData.type === 'word' ? 0x4a90d9 : 0x50c878
        
        card1.background.setFillStyle(0xffd700)
        card2.background.setFillStyle(0xffd700)
        
        this.time.delayedCall(1500, () => {
          if (card1.container.active) card1.background.setFillStyle(originalColor1)
          if (card2.container.active) card2.background.setFillStyle(originalColor2)
        })
      }
    }
  }

  /**
   * Find a valid pair on the board
   */
  private findValidPair(boardState: BoardState): { pos1: Position; pos2: Position } | null {
    const cards: { card: WordCard; pos: Position }[] = []
    
    // Collect all cards
    for (let row = 0; row < boardState.rows; row++) {
      for (let col = 0; col < boardState.cols; col++) {
        const card = boardState.grid[row][col]
        if (card) {
          cards.push({ card, pos: { row, col } })
        }
      }
    }
    
    // Find matching pairs with valid paths
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const c1 = cards[i]
        const c2 = cards[j]
        
        // Check if they match
        if (c1.card.pairId === c2.card.pairId && c1.card.type !== c2.card.type) {
          // Check if path exists
          const path = this.pathFinder.findPath(c1.pos, c2.pos, boardState)
          if (path) {
            return { pos1: c1.pos, pos2: c2.pos }
          }
        }
      }
    }
    
    return null
  }

  /**
   * Get current game state for serialization
   */
  getGameState(): GameState {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
    
    return {
      config: this.config,
      board: this.boardManager.getBoardState(),
      score: {
        correct: this.correctCount,
        wrong: this.wrongCount
      },
      elapsedTime: elapsed,
      selectedCard: this.selectedCard?.position || null,
      isComplete: this.boardManager.isGameComplete()
    }
  }
}
