/**
 * BoardManager - 棋盘管理器
 * 
 * Requirements: 2.1, 2.2
 * - 2.1: Display a board with WordCards arranged in a grid matching the selected difficulty size
 * - 2.2: Place matching pairs (word and meaning) randomly across the grid
 */

import type { WordCard, BoardState, Position } from 'shared'

/**
 * 棋盘管理器
 * 负责棋盘初始化、卡片布局、卡片获取和移除、游戏完成检测
 */
export class BoardManager {
  private grid: (WordCard | null)[][]
  private rows: number
  private cols: number
  private remainingCards: number

  constructor() {
    this.grid = []
    this.rows = 0
    this.cols = 0
    this.remainingCards = 0
  }

  /**
   * 初始化棋盘
   * @param rows 行数
   * @param cols 列数
   * @param cards 词卡数组（应包含配对的词卡）
   */
  initBoard(rows: number, cols: number, cards: WordCard[]): void {
    this.rows = rows
    this.cols = cols
    
    // 验证卡片数量是否匹配棋盘大小
    const totalCells = rows * cols
    if (cards.length !== totalCells) {
      throw new Error(`Card count (${cards.length}) does not match board size (${totalCells})`)
    }

    // 随机打乱卡片顺序
    const shuffledCards = this.shuffleCards([...cards])

    // 初始化网格并放置卡片
    this.grid = []
    for (let r = 0; r < rows; r++) {
      this.grid[r] = []
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c
        this.grid[r][c] = shuffledCards[index]
      }
    }

    this.remainingCards = totalCells
  }

  /**
   * Fisher-Yates 洗牌算法
   */
  private shuffleCards(cards: WordCard[]): WordCard[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
    }
    return cards
  }

  /**
   * 获取指定位置的卡片
   * @param row 行号
   * @param col 列号
   * @returns 卡片或 null（如果位置为空或越界）
   */
  getCardAt(row: number, col: number): WordCard | null {
    if (!this.isValidPosition(row, col)) {
      return null
    }
    return this.grid[row][col]
  }

  /**
   * 检查位置是否有效
   */
  isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols
  }

  /**
   * 检查位置是否为空（可通行）
   */
  isEmpty(row: number, col: number): boolean {
    // 边界外视为可通行（用于路径查找）
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return true
    }
    return this.grid[row][col] === null
  }

  /**
   * 移除指定位置的卡片
   * @param row 行号
   * @param col 列号
   */
  removeCard(row: number, col: number): void {
    if (this.isValidPosition(row, col) && this.grid[row][col] !== null) {
      this.grid[row][col] = null
      this.remainingCards--
    }
  }

  /**
   * 移除一对卡片
   * @param pos1 第一张卡片位置
   * @param pos2 第二张卡片位置
   */
  removeCardPair(pos1: Position, pos2: Position): void {
    this.removeCard(pos1.row, pos1.col)
    this.removeCard(pos2.row, pos2.col)
  }

  /**
   * 检查游戏是否完成（所有卡片都已移除）
   */
  isGameComplete(): boolean {
    return this.remainingCards === 0
  }

  /**
   * 获取剩余卡片数量
   */
  getRemainingCardCount(): number {
    return this.remainingCards
  }

  /**
   * 获取当前棋盘状态
   */
  getBoardState(): BoardState {
    // 深拷贝网格
    const gridCopy = this.grid.map(row => [...row])
    return {
      grid: gridCopy,
      rows: this.rows,
      cols: this.cols
    }
  }

  /**
   * 从棋盘状态恢复
   * @param state 棋盘状态
   */
  restoreFromState(state: BoardState): void {
    this.rows = state.rows
    this.cols = state.cols
    this.grid = state.grid.map(row => [...row])
    
    // 计算剩余卡片数量
    this.remainingCards = 0
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell !== null) {
          this.remainingCards++
        }
      }
    }
  }

  /**
   * 获取所有剩余卡片的位置
   */
  getAllCardPositions(): Position[] {
    const positions: Position[] = []
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== null) {
          positions.push({ row: r, col: c })
        }
      }
    }
    return positions
  }

  /**
   * 获取棋盘尺寸
   */
  getSize(): { rows: number; cols: number } {
    return { rows: this.rows, cols: this.cols }
  }
}
