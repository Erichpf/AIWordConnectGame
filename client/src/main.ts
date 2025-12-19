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

// Game configuration - 使用更高分辨率避免模糊
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1280,
  height: 800,
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    pixelArt: false,
    antialias: true,
    roundPixels: true
  },
  scene: [BootScene, MenuScene, GameScene]
}

// Create game instance
const game = new Phaser.Game(config)

console.log('智连词境 - AI Word Connect Game initialized')

export { game }
