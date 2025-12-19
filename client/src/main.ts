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

// Game configuration
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene]
}

// Create game instance
const game = new Phaser.Game(config)

console.log('智连词境 - AI Word Connect Game initialized')

export { game }
