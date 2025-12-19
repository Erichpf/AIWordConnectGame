/**
 * CardManager - 卡片管理器
 * 
 * Requirements: 2.3, 4.1
 * - 2.3: Highlight the selected card visually
 * - 4.1: Remove both cards from the board and display a success indicator
 */

import Phaser from 'phaser'
import type { WordCard, Position } from 'shared'

// Card visual constants - 增大卡片尺寸以适应更高分辨率
export const CARD_WIDTH = 120
export const CARD_HEIGHT = 80
export const CARD_PADDING = 12

export const CARD_COLORS = {
  word: 0x3d7ab8,      // Blue for word cards
  meaning: 0x45a868,   // Green for meaning cards
  selected: 0xf5c842,  // Gold for selected
  hover: 0x5a9fd4,     // Light blue for hover
  error: 0xe85454      // Red for error
}

/**
 * CardSprite - 卡片精灵接口
 */
export interface CardSprite {
  container: Phaser.GameObjects.Container
  cardData: WordCard
  position: Position
  background: Phaser.GameObjects.Rectangle
  text: Phaser.GameObjects.Text
  isSelected: boolean
}

/**
 * CardManager - 卡片管理器
 * 负责卡片精灵创建、选中/取消选中效果、移除动画
 */
export class CardManager {
  private scene: Phaser.Scene
  private cardSprites: Map<string, CardSprite> = new Map()
  private boardOffsetX: number = 0
  private boardOffsetY: number = 0

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * 设置棋盘偏移量（用于居中显示）
   */
  setBoardOffset(offsetX: number, offsetY: number): void {
    this.boardOffsetX = offsetX
    this.boardOffsetY = offsetY
  }


  /**
   * 创建卡片精灵
   * @param card 词卡数据
   * @param position 棋盘位置
   * @param onClick 点击回调
   * @returns CardSprite 对象
   */
  createCardSprite(
    card: WordCard, 
    position: Position,
    onClick?: (cardSprite: CardSprite) => void
  ): CardSprite {
    const screenPos = this.gridToScreen(position)
    
    // Create container
    const container = this.scene.add.container(screenPos.x, screenPos.y)
    
    // Background with rounded corners effect (using graphics)
    const bgColor = card.type === 'word' ? CARD_COLORS.word : CARD_COLORS.meaning
    const background = this.scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, bgColor)
    background.setStrokeStyle(2, 0xffffff, 0.4)
    
    // Add subtle gradient overlay for depth
    const overlay = this.scene.add.rectangle(0, -CARD_HEIGHT/4, CARD_WIDTH - 4, CARD_HEIGHT/2 - 2, 0xffffff, 0.08)
    
    // Text - show word or meaning based on card type
    const displayText = card.type === 'word' ? card.word : card.meaning
    const fontSize = this.calculateFontSize(displayText)
    const text = this.scene.add.text(0, 0, displayText, {
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      fontFamily: 'Noto Sans SC, sans-serif',
      fontStyle: 'bold',
      wordWrap: { width: CARD_WIDTH - 16, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 4
    }).setOrigin(0.5)
    
    // Ensure text fits within card
    if (text.height > CARD_HEIGHT - 16) {
      const scale = (CARD_HEIGHT - 16) / text.height
      text.setScale(Math.max(scale, 0.7))
    }
    
    container.add([background, overlay, text])
    
    // Add shadow effect
    container.setData('shadow', this.createCardShadow(container))
    
    // Create CardSprite object
    const cardSprite: CardSprite = {
      container,
      cardData: card,
      position,
      background,
      text,
      isSelected: false
    }
    
    // Make interactive
    container.setSize(CARD_WIDTH, CARD_HEIGHT)
    container.setInteractive({ useHandCursor: true })
    
    // Event handlers
    container.on('pointerover', () => this.onCardHover(cardSprite))
    container.on('pointerout', () => this.onCardOut(cardSprite))
    
    if (onClick) {
      container.on('pointerdown', () => onClick(cardSprite))
    }
    
    // Store in map
    const key = this.getPositionKey(position)
    this.cardSprites.set(key, cardSprite)
    
    return cardSprite
  }

  /**
   * 创建卡片阴影效果
   */
  private createCardShadow(container: Phaser.GameObjects.Container): Phaser.GameObjects.Rectangle {
    const shadow = this.scene.add.rectangle(3, 3, CARD_WIDTH, CARD_HEIGHT, 0x000000, 0.3)
    container.addAt(shadow, 0)
    return shadow
  }

  /**
   * 播放卡片入场动画
   * @param cardSprite 卡片精灵
   * @param delay 延迟时间（毫秒）
   */
  playEntryAnimation(cardSprite: CardSprite, delay: number = 0): void {
    cardSprite.container.setScale(0)
    cardSprite.container.setAlpha(0)
    
    this.scene.tweens.add({
      targets: cardSprite.container,
      scale: 1,
      alpha: 1,
      duration: 300,
      delay,
      ease: 'Back.easeOut'
    })
  }

  /**
   * 选中卡片
   * @param card 卡片精灵
   */
  selectCard(card: CardSprite): void {
    card.isSelected = true
    card.background.setFillStyle(CARD_COLORS.selected)
    card.background.setStrokeStyle(3, 0xffffff, 1)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1.1,
      duration: 150,
      ease: 'Back.easeOut'
    })
  }

  /**
   * 取消选中卡片
   * @param card 卡片精灵
   */
  deselectCard(card: CardSprite): void {
    card.isSelected = false
    const bgColor = card.cardData.type === 'word' ? CARD_COLORS.word : CARD_COLORS.meaning
    card.background.setFillStyle(bgColor)
    card.background.setStrokeStyle(2, 0xffffff, 0.3)
    
    this.scene.tweens.add({
      targets: card.container,
      scale: 1,
      duration: 150
    })
  }


  /**
   * 移除卡片动画
   * @param card1 第一张卡片
   * @param card2 第二张卡片
   * @returns Promise，动画完成后 resolve
   */
  async removeCardsWithAnimation(card1: CardSprite, card2: CardSprite): Promise<void> {
    return new Promise(resolve => {
      // Scale down and fade out
      this.scene.tweens.add({
        targets: [card1.container, card2.container],
        scale: 0,
        alpha: 0,
        duration: 300,
        ease: 'Back.easeIn',
        onComplete: () => {
          // Remove from map
          this.cardSprites.delete(this.getPositionKey(card1.position))
          this.cardSprites.delete(this.getPositionKey(card2.position))
          
          // Destroy sprites
          card1.container.destroy()
          card2.container.destroy()
          
          resolve()
        }
      })
    })
  }

  /**
   * 播放成功闪烁效果
   * @param card1 第一张卡片
   * @param card2 第二张卡片
   * @returns Promise，动画完成后 resolve
   */
  async playSuccessFlash(card1: CardSprite, card2: CardSprite): Promise<void> {
    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: [card1.container, card2.container],
        alpha: 0.5,
        yoyo: true,
        duration: 100,
        repeat: 2,
        onComplete: () => resolve()
      })
    })
  }

  /**
   * 播放错误抖动效果
   * @param card1 第一张卡片
   * @param card2 第二张卡片
   * @returns Promise，动画完成后 resolve
   */
  async playErrorShake(card1: CardSprite, card2: CardSprite): Promise<void> {
    // Flash red
    card1.background.setFillStyle(CARD_COLORS.error)
    card2.background.setFillStyle(CARD_COLORS.error)
    
    const shakeCard = (card: CardSprite): Promise<void> => {
      return new Promise(resolve => {
        const originalX = card.container.x
        this.scene.tweens.add({
          targets: card.container,
          x: originalX - 5,
          duration: 50,
          yoyo: true,
          repeat: 3,
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
    
    card.background.setFillStyle(CARD_COLORS.hover)
    this.scene.tweens.add({
      targets: card.container,
      scale: 1.05,
      duration: 100
    })
  }

  /**
   * 鼠标移出效果
   */
  private onCardOut(card: CardSprite): void {
    if (card.isSelected) return
    
    const bgColor = card.cardData.type === 'word' ? CARD_COLORS.word : CARD_COLORS.meaning
    card.background.setFillStyle(bgColor)
    this.scene.tweens.add({
      targets: card.container,
      scale: 1,
      duration: 100
    })
  }

  /**
   * 计算字体大小 - 根据文本长度动态调整
   */
  private calculateFontSize(text: string): number {
    const len = text.length
    if (len <= 2) return 22
    if (len <= 4) return 18
    if (len <= 6) return 16
    if (len <= 10) return 14
    if (len <= 15) return 12
    return 11
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

  /**
   * 获取位置键
   */
  private getPositionKey(position: Position): string {
    return `${position.row},${position.col}`
  }

  /**
   * 根据位置获取卡片精灵
   */
  getCardSpriteAt(position: Position): CardSprite | undefined {
    return this.cardSprites.get(this.getPositionKey(position))
  }

  /**
   * 获取所有卡片精灵
   */
  getAllCardSprites(): CardSprite[] {
    return Array.from(this.cardSprites.values())
  }

  /**
   * 清除所有卡片精灵
   */
  clearAll(): void {
    for (const cardSprite of this.cardSprites.values()) {
      cardSprite.container.destroy()
    }
    this.cardSprites.clear()
  }

  /**
   * 获取卡片数量
   */
  getCardCount(): number {
    return this.cardSprites.size
  }
}
