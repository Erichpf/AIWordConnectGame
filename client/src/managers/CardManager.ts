/**
 * CardManager - 卡片管理器
 * 
 * Requirements: 2.3, 4.1
 * - 2.3: Highlight the selected card visually
 * - 4.1: Remove both cards from the board and display a success indicator
 */

import Phaser from 'phaser'
import type { WordCard, Position, Language } from 'shared'

// Card visual constants
export const CARD_WIDTH = 120
export const CARD_HEIGHT = 80
export const CARD_PADDING = 12

// 卡片主题配置
export interface CardTheme {
  wordBg: number
  meaningBg: number
  wordAccent: number
  meaningAccent: number
  wordIcon: string
  meaningIcon: string
}

// 中文主题 - 古典风格
const CHINESE_THEME: CardTheme = {
  wordBg: 0x8b4513,      // 棕红色（古籍感）
  meaningBg: 0x2d5a4a,   // 墨绿色
  wordAccent: 0xd4a574,  // 金边
  meaningAccent: 0x5a9a7a,
  wordIcon: '📜',
  meaningIcon: '🖌️'
}

// 英文主题 - 现代风格
const ENGLISH_THEME: CardTheme = {
  wordBg: 0x3a5ba0,      // 深蓝色
  meaningBg: 0x6a4c93,   // 紫色
  wordAccent: 0x5a8bd0,
  meaningAccent: 0x9a7cc3,
  wordIcon: '🔤',
  meaningIcon: '💬'
}

export const CARD_COLORS = {
  selected: 0xf5c842,
  hover: 0x5a9fd4,
  error: 0xe85454
}

/**
 * CardSprite - 卡片精灵接口
 */
export interface CardSprite {
  container: Phaser.GameObjects.Container
  cardData: WordCard
  position: Position
  background: Phaser.GameObjects.Graphics
  text: Phaser.GameObjects.Text
  isSelected: boolean
  theme: CardTheme
  originalBgColor: number
}

/**
 * CardManager - 卡片管理器
 */
export class CardManager {
  private scene: Phaser.Scene
  private cardSprites: Map<string, CardSprite> = new Map()
  private boardOffsetX: number = 0
  private boardOffsetY: number = 0
  private language: Language = 'zh'

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 设置语言模式
   */
  setLanguage(language: Language): void {
    this.language = language
  }

  /**
   * 获取当前主题
   */
  private getTheme(): CardTheme {
    return this.language === 'zh' ? CHINESE_THEME : ENGLISH_THEME
  }

  /**
   * 设置棋盘偏移量
   */
  setBoardOffset(offsetX: number, offsetY: number): void {
    this.boardOffsetX = offsetX
    this.boardOffsetY = offsetY
  }

  /**
   * 创建卡片精灵
   */
  createCardSprite(
    card: WordCard, 
    position: Position,
    onClick?: (cardSprite: CardSprite) => void
  ): CardSprite {
    const screenPos = this.gridToScreen(position)
    const theme = this.getTheme()
    const isWord = card.type === 'word'
    
    const container = this.scene.add.container(screenPos.x, screenPos.y)
    
    // 创建阴影
    const shadow = this.scene.add.graphics()
    shadow.fillStyle(0x000000, 0.3)
    shadow.fillRoundedRect(4, 4, CARD_WIDTH, CARD_HEIGHT, 10)
    container.add(shadow)
    
    // 创建卡片背景
    const bgColor = isWord ? theme.wordBg : theme.meaningBg
    const accentColor = isWord ? theme.wordAccent : theme.meaningAccent
    const background = this.createCardBackground(bgColor, accentColor, isWord)
    container.add(background)
    
    // 添加装饰图案
    const decoration = this.createCardDecoration(isWord, theme)
    container.add(decoration)
    
    // 添加角标图标
    const icon = this.scene.add.text(
      -CARD_WIDTH/2 + 12, 
      -CARD_HEIGHT/2 + 8, 
      isWord ? theme.wordIcon : theme.meaningIcon,
      { fontSize: '14px' }
    )
    container.add(icon)
    
    // 文字内容 - 使用更大基础字号提升清晰度
    const displayText = isWord ? card.word : card.meaning
    const fontSize = this.calculateFontSize(displayText)
    const text = this.scene.add.text(0, 5, displayText, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontStyle: '600',
      wordWrap: { width: CARD_WIDTH - 20, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4,
      resolution: 2,
      shadow: {
        offsetX: 1,
        offsetY: 1,
        color: '#000000',
        blur: 3,
        fill: true
      }
    }).setOrigin(0.5)
    
    // 确保文字适应卡片
    if (text.height > CARD_HEIGHT - 24) {
      const scale = (CARD_HEIGHT - 24) / text.height
      text.setScale(Math.max(scale, 0.65))
    }
    
    container.add(text)
    
    // 添加光泽效果
    const shine = this.createShineEffect()
    container.add(shine)
    
    const cardSprite: CardSprite = {
      container,
      cardData: card,
      position,
      background,
      text,
      isSelected: false,
      theme,
      originalBgColor: bgColor
    }
    
    container.setSize(CARD_WIDTH, CARD_HEIGHT)
    container.setInteractive({ useHandCursor: true })
    
    container.on('pointerover', () => this.onCardHover(cardSprite))
    container.on('pointerout', () => this.onCardOut(cardSprite))
    
    if (onClick) {
      container.on('pointerdown', () => onClick(cardSprite))
    }
    
    const key = this.getPositionKey(position)
    this.cardSprites.set(key, cardSprite)
    
    return cardSprite
  }

  /**
   * 创建卡片背景
   */
  private createCardBackground(bgColor: number, accentColor: number, _isWord: boolean): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics()
    
    // 主背景 - 圆角矩形
    graphics.fillStyle(bgColor)
    graphics.fillRoundedRect(-CARD_WIDTH/2, -CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, 10)
    
    // 边框
    graphics.lineStyle(2, accentColor, 0.8)
    graphics.strokeRoundedRect(-CARD_WIDTH/2, -CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, 10)
    
    // 顶部高光条
    graphics.fillStyle(0xffffff, 0.15)
    graphics.fillRoundedRect(-CARD_WIDTH/2 + 4, -CARD_HEIGHT/2 + 4, CARD_WIDTH - 8, 20, { tl: 8, tr: 8, bl: 0, br: 0 })
    
    // 底部装饰条
    graphics.fillStyle(accentColor, 0.3)
    graphics.fillRoundedRect(-CARD_WIDTH/2 + 4, CARD_HEIGHT/2 - 12, CARD_WIDTH - 8, 8, { tl: 0, tr: 0, bl: 8, br: 8 })
    
    return graphics
  }

  /**
   * 创建卡片装饰图案
   */
  private createCardDecoration(isWord: boolean, theme: CardTheme): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics()
    
    if (this.language === 'zh') {
      // 中文卡片 - 古典纹样
      graphics.lineStyle(1, 0xffffff, 0.1)
      
      if (isWord) {
        // 词语卡 - 书卷纹
        for (let i = 0; i < 3; i++) {
          const y = -CARD_HEIGHT/2 + 25 + i * 8
          graphics.lineBetween(-CARD_WIDTH/2 + 30, y, CARD_WIDTH/2 - 10, y)
        }
        // 角落装饰
        graphics.lineStyle(1.5, theme.wordAccent, 0.3)
        graphics.lineBetween(CARD_WIDTH/2 - 20, -CARD_HEIGHT/2 + 8, CARD_WIDTH/2 - 8, -CARD_HEIGHT/2 + 8)
        graphics.lineBetween(CARD_WIDTH/2 - 8, -CARD_HEIGHT/2 + 8, CARD_WIDTH/2 - 8, -CARD_HEIGHT/2 + 20)
      } else {
        // 释义卡 - 竹简纹
        graphics.lineStyle(1, 0xffffff, 0.08)
        for (let i = 0; i < 5; i++) {
          const x = -CARD_WIDTH/2 + 15 + i * 25
          graphics.lineBetween(x, -CARD_HEIGHT/2 + 25, x, CARD_HEIGHT/2 - 15)
        }
      }
    } else {
      // 英文卡片 - 现代几何
      graphics.lineStyle(1, 0xffffff, 0.1)
      
      if (isWord) {
        // 词语卡 - 圆点装饰
        graphics.fillStyle(0xffffff, 0.1)
        graphics.fillCircle(CARD_WIDTH/2 - 15, CARD_HEIGHT/2 - 15, 4)
        graphics.fillCircle(CARD_WIDTH/2 - 28, CARD_HEIGHT/2 - 15, 3)
        graphics.fillCircle(CARD_WIDTH/2 - 15, CARD_HEIGHT/2 - 28, 3)
      } else {
        // 释义卡 - 对话框装饰
        graphics.lineStyle(1.5, theme.meaningAccent, 0.2)
        graphics.beginPath()
        graphics.moveTo(-CARD_WIDTH/2 + 10, CARD_HEIGHT/2 - 20)
        graphics.lineTo(-CARD_WIDTH/2 + 10, CARD_HEIGHT/2 - 10)
        graphics.lineTo(-CARD_WIDTH/2 + 20, CARD_HEIGHT/2 - 10)
        graphics.strokePath()
      }
    }
    
    return graphics
  }

  /**
   * 创建光泽效果
   */
  private createShineEffect(): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics()
    
    // 左上角光泽
    graphics.fillStyle(0xffffff, 0.05)
    graphics.fillTriangle(
      -CARD_WIDTH/2, -CARD_HEIGHT/2 + 10,
      -CARD_WIDTH/2 + 30, -CARD_HEIGHT/2,
      -CARD_WIDTH/2, -CARD_HEIGHT/2
    )
    
    return graphics
  }

  /**
   * 播放卡片入场动画
   */
  playEntryAnimation(cardSprite: CardSprite, delay: number = 0): void {
    cardSprite.container.setScale(0)
    cardSprite.container.setAlpha(0)
    cardSprite.container.setAngle(-10)
    
    this.scene.tweens.add({
      targets: cardSprite.container,
      scale: 1,
      alpha: 1,
      angle: 0,
      duration: 400,
      delay,
      ease: 'Back.easeOut'
    })
  }

  /**
   * 选中卡片
   */
  selectCard(card: CardSprite): void {
    card.isSelected = true
    
    // 重绘背景为选中色
    this.redrawCardBackground(card, CARD_COLORS.selected, 0xffffff)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1.12,
      duration: 150,
      ease: 'Back.easeOut'
    })
    
    // 添加发光效果
    this.addGlowEffect(card)
  }

  /**
   * 取消选中卡片
   */
  deselectCard(card: CardSprite): void {
    card.isSelected = false
    
    const accentColor = card.cardData.type === 'word' ? card.theme.wordAccent : card.theme.meaningAccent
    this.redrawCardBackground(card, card.originalBgColor, accentColor)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1,
      duration: 150
    })
    
    this.removeGlowEffect(card)
  }

  /**
   * 重绘卡片背景
   */
  private redrawCardBackground(card: CardSprite, bgColor: number, accentColor: number): void {
    card.background.clear()
    
    card.background.fillStyle(bgColor)
    card.background.fillRoundedRect(-CARD_WIDTH/2, -CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, 10)
    
    card.background.lineStyle(3, accentColor, 1)
    card.background.strokeRoundedRect(-CARD_WIDTH/2, -CARD_HEIGHT/2, CARD_WIDTH, CARD_HEIGHT, 10)
    
    card.background.fillStyle(0xffffff, 0.2)
    card.background.fillRoundedRect(-CARD_WIDTH/2 + 4, -CARD_HEIGHT/2 + 4, CARD_WIDTH - 8, 20, { tl: 8, tr: 8, bl: 0, br: 0 })
  }

  /**
   * 添加发光效果
   */
  private addGlowEffect(card: CardSprite): void {
    const glow = this.scene.add.graphics()
    glow.fillStyle(CARD_COLORS.selected, 0.3)
    glow.fillRoundedRect(-CARD_WIDTH/2 - 5, -CARD_HEIGHT/2 - 5, CARD_WIDTH + 10, CARD_HEIGHT + 10, 12)
    card.container.addAt(glow, 0)
    card.container.setData('glow', glow)
    
    // 发光动画
    this.scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1
    })
  }

  /**
   * 移除发光效果
   */
  private removeGlowEffect(card: CardSprite): void {
    const glow = card.container.getData('glow') as Phaser.GameObjects.Graphics
    if (glow) {
      this.scene.tweens.killTweensOf(glow)
      glow.destroy()
      card.container.setData('glow', null)
    }
  }

  /**
   * 移除卡片动画
   */
  async removeCardsWithAnimation(card1: CardSprite, card2: CardSprite): Promise<void> {
    // 移除发光效果
    this.removeGlowEffect(card1)
    this.removeGlowEffect(card2)
    
    return new Promise(resolve => {
      // 旋转消失效果
      this.scene.tweens.add({
        targets: [card1.container, card2.container],
        scale: 0,
        alpha: 0,
        angle: 180,
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => {
          this.cardSprites.delete(this.getPositionKey(card1.position))
          this.cardSprites.delete(this.getPositionKey(card2.position))
          card1.container.destroy()
          card2.container.destroy()
          resolve()
        }
      })
    })
  }

  /**
   * 播放成功闪烁效果
   */
  async playSuccessFlash(card1: CardSprite, card2: CardSprite): Promise<void> {
    return new Promise(resolve => {
      // 绿色闪烁
      this.redrawCardBackground(card1, 0x50c878, 0xffffff)
      this.redrawCardBackground(card2, 0x50c878, 0xffffff)
      
      this.scene.tweens.add({
        targets: [card1.container, card2.container],
        alpha: 0.6,
        yoyo: true,
        duration: 100,
        repeat: 2,
        onComplete: () => resolve()
      })
    })
  }

  /**
   * 播放错误抖动效果
   */
  async playErrorShake(card1: CardSprite, card2: CardSprite): Promise<void> {
    this.redrawCardBackground(card1, CARD_COLORS.error, 0xffffff)
    this.redrawCardBackground(card2, CARD_COLORS.error, 0xffffff)
    
    const shakeCard = (card: CardSprite): Promise<void> => {
      return new Promise(resolve => {
        const originalX = card.container.x
        this.scene.tweens.add({
          targets: card.container,
          x: originalX - 8,
          duration: 50,
          yoyo: true,
          repeat: 4,
          onComplete: () => {
            card.container.x = originalX
            resolve()
          }
        })
      })
    }
    
    await Promise.all([shakeCard(card1), shakeCard(card2)])
  }

  /**
   * 鼠标悬停效果
   */
  private onCardHover(card: CardSprite): void {
    if (card.isSelected) return
    
    this.redrawCardBackground(card, CARD_COLORS.hover, 0xffffff)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1.08,
      duration: 100
    })
  }

  /**
   * 鼠标移出效果
   */
  private onCardOut(card: CardSprite): void {
    if (card.isSelected) return
    
    const accentColor = card.cardData.type === 'word' ? card.theme.wordAccent : card.theme.meaningAccent
    this.redrawCardBackground(card, card.originalBgColor, accentColor)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1,
      duration: 100
    })
  }

  /**
   * 计算字体大小
   */
  private calculateFontSize(text: string): number {
    const len = text.length
    if (len <= 2) return 20
    if (len <= 4) return 17
    if (len <= 6) return 15
    if (len <= 10) return 13
    if (len <= 15) return 11
    return 10
  }

  /**
   * 网格坐标转屏幕坐标
   */
  gridToScreen(position: Position): { x: number; y: number } {
    return {
      x: this.boardOffsetX + position.col * (CARD_WIDTH + CARD_PADDING) + CARD_WIDTH / 2,
      y: this.boardOffsetY + position.row * (CARD_HEIGHT + CARD_PADDING) + CARD_HEIGHT / 2
    }
  }

  private getPositionKey(position: Position): string {
    return `${position.row},${position.col}`
  }

  getCardSpriteAt(position: Position): CardSprite | undefined {
    return this.cardSprites.get(this.getPositionKey(position))
  }

  getAllCardSprites(): CardSprite[] {
    return Array.from(this.cardSprites.values())
  }

  clearAll(): void {
    for (const cardSprite of this.cardSprites.values()) {
      cardSprite.container.destroy()
    }
    this.cardSprites.clear()
  }

  getCardCount(): number {
    return this.cardSprites.size
  }
}
