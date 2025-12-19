/**
 * BootScene - 启动场景
 * 
 * Requirements: 1.1
 * - Load game resources
 * - Initialize game configuration
 */

import Phaser from 'phaser'
import { createDefaultGameConfig } from '../config/gameConfig'
import type { GameConfig } from 'shared'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  /**
   * Preload game assets
   */
  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Loading text
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '24px',
      color: '#ffffff'
    })
    loadingText.setOrigin(0.5)

    // Progress bar background
    const progressBarBg = this.add.rectangle(width / 2, height / 2, 400, 30, 0x222222)
    progressBarBg.setOrigin(0.5)

    // Progress bar fill
    const progressBar = this.add.rectangle(width / 2 - 195, height / 2, 0, 20, 0x4a90d9)
    progressBar.setOrigin(0, 0.5)

    // Update progress bar on load progress
    this.load.on('progress', (value: number) => {
      progressBar.width = 390 * value
    })

    // Clean up on complete
    this.load.on('complete', () => {
      loadingText.destroy()
      progressBarBg.destroy()
      progressBar.destroy()
    })

    // Load placeholder assets (can be expanded later)
    // For now, we'll generate graphics programmatically
  }

  /**
   * Create scene and initialize game
   */
  create(): void {
    // Initialize default game configuration
    const defaultConfig = createDefaultGameConfig()
    
    // Store in registry for access across scenes
    this.registry.set('gameConfig', defaultConfig)
    this.registry.set('gameState', null)

    // Transition to menu scene
    this.scene.start('MenuScene')
  }

  /**
   * Get stored game configuration
   */
  getGameConfig(): GameConfig {
    return this.registry.get('gameConfig') as GameConfig
  }
}
