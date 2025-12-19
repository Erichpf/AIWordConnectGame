/**
 * MenuScene - 菜单场景
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import Phaser from 'phaser'
import { createGameConfig } from '../config/gameConfig'
import type { Language, Level } from 'shared'

interface MenuOption<T> {
  value: T
  label: string
}

const LANGUAGE_OPTIONS: MenuOption<Language>[] = [
  { value: 'zh', label: '中文成语' },
  { value: 'en', label: '英文词汇' }
]

const DIFFICULTY_OPTIONS: MenuOption<Level>[] = [
  { value: 'easy', label: '初级 (4×4)' },
  { value: 'medium', label: '中级 (6×6)' },
  { value: 'hard', label: '高级 (8×8)' }
]

const THEME_OPTIONS: MenuOption<string>[] = [
  { value: 'learning', label: '学习' },
  { value: 'virtue', label: '品德' },
  { value: 'growth', label: '成长' },
  { value: 'technology', label: '科技' }
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
    this.add.text(w / 2, 40, '智连词境', { fontSize: '36px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)
    this.add.text(w / 2, 80, 'AI Word Connect Game', { fontSize: '16px', color: '#aaa' }).setOrigin(0.5)

    this.add.text(w / 2, 130, '语言模式', { fontSize: '16px', color: '#fff' }).setOrigin(0.5)
    this.languageButtons = this.createButtons(LANGUAGE_OPTIONS, 160, this.selectedLanguage, (v) => {
      this.selectedLanguage = v as Language
      this.updateButtons(this.languageButtons, v)
    })

    this.add.text(w / 2, 230, '难度', { fontSize: '16px', color: '#fff' }).setOrigin(0.5)
    this.difficultyButtons = this.createButtons(DIFFICULTY_OPTIONS, 260, this.selectedLevel, (v) => {
      this.selectedLevel = v as Level
      this.updateButtons(this.difficultyButtons, v)
    })

    this.add.text(w / 2, 340, '主题', { fontSize: '16px', color: '#fff' }).setOrigin(0.5)
    this.themeButtons = this.createButtons(THEME_OPTIONS, 370, this.selectedTheme, (v) => {
      this.selectedTheme = v
      this.updateButtons(this.themeButtons, v)
    })

    this.createStartBtn(w)
  }

  private createButtons<T>(opts: MenuOption<T>[], y: number, sel: T, onSel: (v: T) => void): Phaser.GameObjects.Container[] {
    const w = this.cameras.main.width
    const bw = 150, bh = 40, sp = 20
    const tw = opts.length * bw + (opts.length - 1) * sp
    const sx = (w - tw) / 2 + bw / 2
    const btns: Phaser.GameObjects.Container[] = []

    opts.forEach((o, i) => {
      const x = sx + i * (bw + sp)
      const isSel = o.value === sel
      const c = this.add.container(x, y)
      const bg = this.add.rectangle(0, 0, bw, bh, isSel ? 0x4a90d9 : 0x333333)
      bg.setStrokeStyle(2, isSel ? 0xffffff : 0x666666)
      const txt = this.add.text(0, 0, o.label, { fontSize: '14px', color: '#fff' }).setOrigin(0.5)
      c.add([bg, txt])
      c.setSize(bw, bh).setInteractive({ useHandCursor: true })
      c.setData('value', o.value)
      c.setData('bg', bg)
      c.on('pointerover', () => { if (c.getData('value') !== sel) bg.setFillStyle(0x555555) })
      c.on('pointerout', () => { if (c.getData('value') !== sel) bg.setFillStyle(0x333333) })
      c.on('pointerdown', () => onSel(o.value))
      btns.push(c)
    })
    return btns
  }

  private updateButtons(btns: Phaser.GameObjects.Container[], sel: unknown): void {
    btns.forEach(c => {
      const bg = c.getData('bg') as Phaser.GameObjects.Rectangle
      const v = c.getData('value')
      const isSel = v === sel
      bg.setFillStyle(isSel ? 0x4a90d9 : 0x333333)
      bg.setStrokeStyle(2, isSel ? 0xffffff : 0x666666)
    })
  }

  private createStartBtn(w: number): void {
    const c = this.add.container(w / 2, 480)
    const bg = this.add.rectangle(0, 0, 200, 50, 0x50c878)
    bg.setStrokeStyle(3, 0xffffff)
    const txt = this.add.text(0, 0, '开始游戏', { fontSize: '18px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5)
    c.add([bg, txt])
    c.setSize(200, 50).setInteractive({ useHandCursor: true })
    c.on('pointerover', () => { bg.setFillStyle(0x6bd98a); this.tweens.add({ targets: c, scale: 1.05, duration: 100 }) })
    c.on('pointerout', () => { bg.setFillStyle(0x50c878); this.tweens.add({ targets: c, scale: 1, duration: 100 }) })
    c.on('pointerdown', () => this.startGame())
  }

  private startGame(): void {
    const config = createGameConfig(this.selectedLanguage, this.selectedLevel, this.selectedTheme)
    this.registry.set('gameConfig', config)
    this.scene.start('GameScene', { config })
  }
}