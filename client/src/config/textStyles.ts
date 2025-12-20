/**
 * 高清文字样式配置
 * 统一管理游戏中的文字渲染，确保清晰度
 */

import Phaser from 'phaser'

// 基础字体配置
const BASE_FONT_FAMILY = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif'

// 高清文字分辨率
const TEXT_RESOLUTION = 2

/**
 * 创建高清文字的样式配置
 */
export function createTextStyle(options: {
  fontSize?: number | string
  color?: string
  fontStyle?: string
  align?: string
  wordWrapWidth?: number
  shadow?: boolean
}): Phaser.Types.GameObjects.Text.TextStyle {
  const {
    fontSize = 16,
    color = '#ffffff',
    fontStyle = 'normal',
    align = 'center',
    wordWrapWidth,
    shadow = false
  } = options

  const style: Phaser.Types.GameObjects.Text.TextStyle = {
    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
    color,
    fontFamily: BASE_FONT_FAMILY,
    fontStyle,
    align,
    resolution: TEXT_RESOLUTION
  }

  if (wordWrapWidth) {
    style.wordWrap = { width: wordWrapWidth, useAdvancedWrap: true }
  }

  if (shadow) {
    style.shadow = {
      offsetX: 1,
      offsetY: 1,
      color: '#000000',
      blur: 2,
      fill: true
    }
  }

  return style
}

/**
 * 预定义的文字样式
 */
export const TEXT_STYLES = {
  // 大标题
  title: createTextStyle({
    fontSize: 52,
    fontStyle: 'bold',
    shadow: true
  }),
  
  // 副标题
  subtitle: createTextStyle({
    fontSize: 20,
    color: '#8899aa'
  }),
  
  // 章节标题
  sectionTitle: createTextStyle({
    fontSize: 18,
    color: '#aabbcc'
  }),
  
  // 按钮文字
  button: createTextStyle({
    fontSize: 15,
    fontStyle: 'bold'
  }),
  
  // 大按钮文字
  buttonLarge: createTextStyle({
    fontSize: 22,
    fontStyle: 'bold'
  }),
  
  // 游戏UI文字
  gameUI: createTextStyle({
    fontSize: 18
  }),
  
  // 小文字
  small: createTextStyle({
    fontSize: 14,
    color: '#aaaaaa'
  }),
  
  // 提示文字
  hint: createTextStyle({
    fontSize: 12,
    color: '#888888'
  }),
  
  // 统计数字
  stats: createTextStyle({
    fontSize: 15,
    fontStyle: 'bold'
  }),
  
  // Combo 文字
  combo: createTextStyle({
    fontSize: 24,
    color: '#ffd700',
    fontStyle: 'bold',
    shadow: true
  }),
  
  // 错误提示
  error: createTextStyle({
    fontSize: 20,
    color: '#ff4444',
    fontStyle: 'bold'
  })
}

/**
 * 在场景中创建高清文字
 */
export function createHDText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle
): Phaser.GameObjects.Text {
  // 确保有 resolution 设置
  const hdStyle = {
    ...style,
    resolution: style.resolution || TEXT_RESOLUTION,
    fontFamily: style.fontFamily || BASE_FONT_FAMILY
  }
  
  return scene.add.text(x, y, text, hdStyle)
}
