/**
 * 智连词境 - AI Word Connect Game
 * Client Entry Point
 * 
 * Requirements: 2.1 - Display a board with WordCards arranged in a grid
 */

import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'

// 获取设备像素比，用于高清渲染
const dpr = Math.min(window.devicePixelRatio || 1, 2)
const baseWidth = 1280
const baseHeight = 800

// Game configuration - 使用设备像素比提升清晰度
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: baseWidth * dpr,
  height: baseHeight * dpr,
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: baseWidth,
    height: baseHeight,
    zoom: 1 / dpr
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: false,
    transparent: false
  },
  scene: [BootScene, MenuScene, GameScene]
}

// Create game instance
const game = new Phaser.Game(config)

console.log('智连词境 - AI Word Connect Game initialized')

export { game }
