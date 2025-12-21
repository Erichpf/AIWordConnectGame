/**
 * MenuScene - 菜单场景
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import Phaser from 'phaser'
import { createGameConfig } from '../config/gameConfig'
import { createHDText, TEXT_STYLES, createTextStyle } from '../config/textStyles'
import type { Language, Level } from 'shared'

interface MenuOption<T> {
  value: T
  label: string
  icon?: string
}

const LANGUAGE_OPTIONS: MenuOption<Language>[] = [
  { value: 'zh', label: '中文成语', icon: '🀄' },
  { value: 'en', label: '英文词汇', icon: '🔤' }
]

const DIFFICULTY_OPTIONS: MenuOption<Level>[] = [
  { value: 'easy', label: '初级 (4×4)', icon: '⭐' },
  { value: 'medium', label: '中级 (6×6)', icon: '⭐⭐' },
  { value: 'hard', label: '高级 (8×8)', icon: '⭐⭐⭐' }
]

const THEME_OPTIONS: MenuOption<string>[] = [
  { value: 'learning', label: '学习', icon: '📚' },
  { value: 'virtue', label: '品德', icon: '💎' },
  { value: 'growth', label: '成长', icon: '🌱' },
  { value: 'technology', label: '科技', icon: '🔬' }
]

export class MenuScene extends Phaser.Scene {
  private selectedLanguage: Language = 'zh'
  private selectedLevel: Level = 'easy'
  private selectedTheme: string = 'learning'
  private languageButtons: Phaser.GameObjects.Container[] = []
  private difficultyButtons: Phaser.GameObjects.Container[] = []
  private themeButtons: Phaser.GameObjects.Container[] = []

  constructor() {
    super({ key: 'MenuScene' })
  }

  create(): void {
    const w = this.cameras.main.width
    const h = this.cameras.main.height

    // 背景装饰
    this.createBackground(w, h)
    
    // 浮动粒子效果
    this.createFloatingParticles(w, h)

    // 标题区域
    this.createTitle(w)

    // 选项区域 - 居中布局
    const centerY = h / 2 - 30

    // 语言模式
    this.createSectionLabel(w / 2, centerY - 120, '🎯 语言模式')
    this.languageButtons = this.createButtons(LANGUAGE_OPTIONS, centerY - 80, this.selectedLanguage, (v) => {
      this.selectedLanguage = v as Language
      this.updateButtons(this.languageButtons, v)
    })

    // 难度选择
    this.createSectionLabel(w / 2, centerY + 10, '📊 难度选择')
    this.difficultyButtons = this.createButtons(DIFFICULTY_OPTIONS, centerY + 50, this.selectedLevel, (v) => {
      this.selectedLevel = v as Level
      this.updateButtons(this.difficultyButtons, v)
    })

    // 主题选择
    this.createSectionLabel(w / 2, centerY + 140, '🎨 主题选择')
    this.themeButtons = this.createButtons(THEME_OPTIONS, centerY + 180, this.selectedTheme, (v) => {
      this.selectedTheme = v
      this.updateButtons(this.themeButtons, v)
    })

    // 开始按钮
    this.createStartBtn(w, centerY + 290)

    // 底部信息 - 高清渲染
    createHDText(this, w / 2, h - 30, 'Powered by AI · 智能词汇学习', createTextStyle({
      fontSize: 14,
      color: '#666666'
    })).setOrigin(0.5)
  }

  private createBackground(w: number, h: number): void {
    // 渐变背景
    const graphics = this.add.graphics()
    
    // 深蓝到紫色渐变效果（用多个矩形模拟）
    const gradientSteps = 20
    for (let i = 0; i < gradientSteps; i++) {
      const ratio = i / gradientSteps
      const y = h * ratio
      const stepHeight = h / gradientSteps + 1
      // 从深蓝 (0x1a1a2e) 渐变到深紫 (0x2d1f3d)
      const r = Math.floor(0x1a + (0x2d - 0x1a) * ratio)
      const g = Math.floor(0x1a + (0x1f - 0x1a) * ratio)
      const b = Math.floor(0x2e + (0x3d - 0x2e) * ratio)
      const color = (r << 16) | (g << 8) | b
      graphics.fillStyle(color, 1)
      graphics.fillRect(0, y, w, stepHeight)
    }
    
    // 添加装饰性圆形光晕
    graphics.fillStyle(0x4a90d9, 0.08)
    graphics.fillCircle(w * 0.1, h * 0.2, 180)
    graphics.fillCircle(w * 0.9, h * 0.8, 220)
    
    graphics.fillStyle(0x50c878, 0.08)
    graphics.fillCircle(w * 0.85, h * 0.15, 120)
    graphics.fillCircle(w * 0.15, h * 0.85, 140)
    
    graphics.fillStyle(0x9b59b6, 0.06)
    graphics.fillCircle(w * 0.5, h * 0.1, 100)
    graphics.fillCircle(w * 0.3, h * 0.6, 90)

    // 添加网格线装饰
    graphics.lineStyle(1, 0xffffff, 0.04)
    for (let i = 0; i < w; i += 60) {
      graphics.lineBetween(i, 0, i, h)
    }
    for (let i = 0; i < h; i += 60) {
      graphics.lineBetween(0, i, w, i)
    }
  }
  
  /**
   * 创建浮动粒子效果 - 增加数量和多样性
   */
  private createFloatingParticles(w: number, h: number): void {
    // 更多的装饰符号
    const symbols = ['📚', '🎯', '💡', '⭐', '🔤', '🀄', '✨', '🎮', '📖', '🏆', '💫', '🌟', '📝', '🎓', '💭', '🔮']
    
    // 增加粒子数量到 25 个
    for (let i = 0; i < 25; i++) {
      const symbol = symbols[i % symbols.length]
      const x = Phaser.Math.Between(30, w - 30)
      const y = Phaser.Math.Between(60, h - 60)
      const size = Phaser.Math.Between(16, 36)
      const baseAlpha = Phaser.Math.FloatBetween(0.15, 0.35)
      
      const particle = this.add.text(x, y, symbol, {
        fontSize: `${size}px`
      }).setAlpha(baseAlpha).setDepth(-1)
      
      // 缓慢浮动动画 - 更大范围
      this.tweens.add({
        targets: particle,
        y: y + Phaser.Math.Between(-50, 50),
        x: x + Phaser.Math.Between(-40, 40),
        alpha: { from: baseAlpha * 0.6, to: baseAlpha * 1.3 },
        duration: Phaser.Math.Between(4000, 8000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      })
      
      // 轻微旋转和缩放
      this.tweens.add({
        targets: particle,
        angle: { from: -15, to: 15 },
        scale: { from: 0.9, to: 1.1 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 1500)
      })
    }
    
    // 添加更亮的光点
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(50, w - 50)
      const y = Phaser.Math.Between(80, h - 80)
      const radius = Phaser.Math.Between(2, 5)
      const colors = [0xffffff, 0x4a90d9, 0x50c878, 0xffd700]
      const color = colors[i % colors.length]
      
      const dot = this.add.circle(x, y, radius, color, 0.25)
      dot.setDepth(-1)
      
      this.tweens.add({
        targets: dot,
        alpha: { from: 0.1, to: 0.5 },
        scale: { from: 0.8, to: 1.4 },
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      })
    }
  }

  private createTitle(w: number): void {
    // 主标题 - 使用高清文字
    const title = createHDText(this, w / 2, 80, '智连词境', TEXT_STYLES.title).setOrigin(0.5)
    title.setShadow(0, 0, '#4a90d9', 20, true, true)

    // 副标题
    createHDText(this, w / 2, 135, 'AI Word Connect Game', TEXT_STYLES.subtitle).setOrigin(0.5)

    // 分隔线
    const line = this.add.graphics()
    line.lineStyle(2, 0x4a90d9, 0.5)
    line.lineBetween(w / 2 - 150, 165, w / 2 + 150, 165)
  }

  private createSectionLabel(x: number, y: number, text: string): void {
    createHDText(this, x, y, text, TEXT_STYLES.sectionTitle).setOrigin(0.5)
  }

  private createButtons<T>(
    opts: MenuOption<T>[],
    y: number,
    sel: T,
    onSel: (v: T) => void
  ): Phaser.GameObjects.Container[] {
    const w = this.cameras.main.width
    const bw = 180, bh = 50, sp = 24
    const tw = opts.length * bw + (opts.length - 1) * sp
    const sx = (w - tw) / 2 + bw / 2
    const btns: Phaser.GameObjects.Container[] = []

    opts.forEach((o, i) => {
      const x = sx + i * (bw + sp)
      const isSel = o.value === sel
      const c = this.add.container(x, y)

      // 阴影
      const shadow = this.add.rectangle(3, 3, bw, bh, 0x000000, 0.3)

      // 背景
      const bg = this.add.rectangle(0, 0, bw, bh, isSel ? 0x4a90d9 : 0x2a2a3e)
      bg.setStrokeStyle(2, isSel ? 0x6bb3f0 : 0x444466)

      // 高光
      const highlight = this.add.rectangle(0, -bh/4, bw - 4, bh/2 - 2, 0xffffff, isSel ? 0.1 : 0.05)

      // 图标和文字 - 高清渲染
      const label = o.icon ? `${o.icon} ${o.label}` : o.label
      const txt = createHDText(this, 0, 0, label, createTextStyle({
        fontSize: 15,
        color: isSel ? '#ffffff' : '#aaaaaa',
        fontStyle: isSel ? 'bold' : 'normal'
      })).setOrigin(0.5)

      c.add([shadow, bg, highlight, txt])
      c.setSize(bw, bh).setInteractive({ useHandCursor: true })
      c.setData('value', o.value)
      c.setData('bg', bg)
      c.setData('txt', txt)
      c.setData('highlight', highlight)
      c.setData('shadow', shadow)

      c.on('pointerover', () => {
        if (c.getData('value') !== this.getSelectedValue(btns)) {
          bg.setFillStyle(0x3a3a4e)
          txt.setColor('#cccccc')
          this.tweens.add({ targets: c, scale: 1.03, duration: 100 })
        }
      })

      c.on('pointerout', () => {
        if (c.getData('value') !== this.getSelectedValue(btns)) {
          bg.setFillStyle(0x2a2a3e)
          txt.setColor('#aaaaaa')
          this.tweens.add({ targets: c, scale: 1, duration: 100 })
        }
      })

      c.on('pointerdown', () => {
        onSel(o.value)
        // 点击动画
        this.tweens.add({
          targets: c,
          scale: 0.95,
          duration: 50,
          yoyo: true
        })
      })

      btns.push(c)
    })
    return btns
  }

  private getSelectedValue(btns: Phaser.GameObjects.Container[]): unknown {
    if (btns === this.languageButtons) return this.selectedLanguage
    if (btns === this.difficultyButtons) return this.selectedLevel
    if (btns === this.themeButtons) return this.selectedTheme
    return null
  }

  private updateButtons(btns: Phaser.GameObjects.Container[], sel: unknown): void {
    btns.forEach(c => {
      const bg = c.getData('bg') as Phaser.GameObjects.Rectangle
      const txt = c.getData('txt') as Phaser.GameObjects.Text
      const highlight = c.getData('highlight') as Phaser.GameObjects.Rectangle
      const v = c.getData('value')
      const isSel = v === sel

      bg.setFillStyle(isSel ? 0x4a90d9 : 0x2a2a3e)
      bg.setStrokeStyle(2, isSel ? 0x6bb3f0 : 0x444466)
      txt.setColor(isSel ? '#ffffff' : '#aaaaaa')
      txt.setFontStyle(isSel ? 'bold' : 'normal')
      highlight.setAlpha(isSel ? 0.1 : 0.05)
      c.setScale(1)
    })
  }

  private createStartBtn(w: number, y: number): void {
    const c = this.add.container(w / 2, y)

    // 阴影
    const shadow = this.add.rectangle(4, 4, 240, 60, 0x000000, 0.4)

    // 背景
    const bg = this.add.rectangle(0, 0, 240, 60, 0x50c878)
    bg.setStrokeStyle(3, 0x6bd98a)

    // 高光
    const highlight = this.add.rectangle(0, -15, 232, 25, 0xffffff, 0.15)

    // 文字 - 高清渲染
    const txt = createHDText(this, 0, 0, '🚀 开始游戏', TEXT_STYLES.buttonLarge).setOrigin(0.5)

    c.add([shadow, bg, highlight, txt])
    c.setSize(240, 60).setInteractive({ useHandCursor: true })

    c.on('pointerover', () => {
      bg.setFillStyle(0x5ed98a)
      this.tweens.add({ targets: c, scale: 1.05, duration: 150, ease: 'Back.easeOut' })
    })

    c.on('pointerout', () => {
      bg.setFillStyle(0x50c878)
      this.tweens.add({ targets: c, scale: 1, duration: 150 })
    })

    c.on('pointerdown', () => {
      this.tweens.add({
        targets: c,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        onComplete: () => this.startGame()
      })
    })

    // 呼吸动画
    this.tweens.add({
      targets: c,
      scale: 1.02,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    })
  }

  private startGame(): void {
    const config = createGameConfig(this.selectedLanguage, this.selectedLevel, this.selectedTheme)
    this.registry.set('gameConfig', config)
    this.scene.start('GameScene', { config })
  }
}
