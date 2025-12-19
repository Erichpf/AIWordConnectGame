/**
 * PathFinder - 路径查找器
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5
 * - 3.2: Use BFS algorithm to find valid connections
 * - 3.3: Direct line path (0 turns) is valid
 * - 3.4: Path with one turn is valid
 * - 3.5: Path with two turns is valid, more than 2 turns is invalid
 */

import type { Position, Path, BoardState } from 'shared'

/**
 * 方向向量
 */
const DIRECTIONS = [
  { row: -1, col: 0 },  // 上
  { row: 1, col: 0 },   // 下
  { row: 0, col: -1 },  // 左
  { row: 0, col: 1 }    // 右
]

/**
 * BFS 状态节点
 */
interface BFSNode {
  position: Position
  direction: number  // -1 表示起点，0-3 表示四个方向
  turns: number
  path: Position[]
}

/**
 * 路径查找器
 * 使用 BFS 算法查找两点之间最多 2 个拐点的有效路径
 */
export class PathFinder {
  /**
   * 查找两点之间的有效路径（≤2拐点）
   * @param start 起点位置
   * @param end 终点位置
   * @param board 棋盘状态
   * @returns 有效路径或 null
   */
  findPath(start: Position, end: Position, board: BoardState): Path | null {
    // 起点和终点相同，无效
    if (start.row === end.row && start.col === end.col) {
      return null
    }

    // BFS 队列
    const queue: BFSNode[] = []
    
    // 访问记录：[row][col][direction][turns] -> 是否访问过
    // 使用 Map 来记录访问状态
    const visited = new Map<string, boolean>()

    const getVisitedKey = (row: number, col: number, dir: number, turns: number): string => {
      return `${row},${col},${dir},${turns}`
    }

    // 初始化：从起点向四个方向出发
    for (let d = 0; d < 4; d++) {
      const newRow = start.row + DIRECTIONS[d].row
      const newCol = start.col + DIRECTIONS[d].col

      // 检查是否到达终点
      if (newRow === end.row && newCol === end.col) {
        return {
          points: [start, end],
          turns: 0
        }
      }

      // 检查是否可通行
      if (this.isPassable(newRow, newCol, board, end)) {
        queue.push({
          position: { row: newRow, col: newCol },
          direction: d,
          turns: 0,
          path: [start, { row: newRow, col: newCol }]
        })
        visited.set(getVisitedKey(newRow, newCol, d, 0), true)
      }
    }

    // BFS 搜索
    while (queue.length > 0) {
      const current = queue.shift()!
      const { position, direction, turns, path } = current

      // 尝试四个方向
      for (let d = 0; d < 4; d++) {
        const newRow = position.row + DIRECTIONS[d].row
        const newCol = position.col + DIRECTIONS[d].col
        
        // 计算新的拐点数
        const newTurns = d === direction ? turns : turns + 1

        // 超过 2 个拐点，跳过
        if (newTurns > 2) {
          continue
        }

        // 检查是否到达终点
        if (newRow === end.row && newCol === end.col) {
          return {
            points: [...path, end],
            turns: newTurns
          }
        }

        // 检查是否可通行且未访问过
        if (this.isPassable(newRow, newCol, board, end)) {
          const key = getVisitedKey(newRow, newCol, d, newTurns)
          if (!visited.has(key)) {
            visited.set(key, true)
            queue.push({
              position: { row: newRow, col: newCol },
              direction: d,
              turns: newTurns,
              path: [...path, { row: newRow, col: newCol }]
            })
          }
        }
      }
    }

    // 未找到有效路径
    return null
  }

  /**
   * 检查位置是否可通行
   * 可通行条件：在边界外（扩展区域）或者是空位
   */
  private isPassable(row: number, col: number, board: BoardState, end: Position): boolean {
    // 终点始终可达
    if (row === end.row && col === end.col) {
      return true
    }

    // 边界外的扩展区域（允许绕行）
    // 扩展一圈边界
    if (row < -1 || row > board.rows || col < -1 || col > board.cols) {
      return false
    }

    // 边界外视为可通行
    if (row < 0 || row >= board.rows || col < 0 || col >= board.cols) {
      return true
    }

    // 棋盘内的空位可通行
    return board.grid[row][col] === null
  }

  /**
   * 检查路径是否有效
   * @param path 路径
   * @returns 是否有效
   */
  isValidPath(path: Path): boolean {
    if (!path || path.points.length < 2) {
      return false
    }
    return path.turns <= 2
  }

  /**
   * 计算路径的拐点数
   * @param points 路径点数组
   * @returns 拐点数
   */
  calculateTurns(points: Position[]): number {
    if (points.length < 3) {
      return 0
    }

    let turns = 0
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]

      // 检查方向是否改变
      const dir1 = this.getDirection(prev, curr)
      const dir2 = this.getDirection(curr, next)

      if (dir1 !== dir2) {
        turns++
      }
    }

    return turns
  }

  /**
   * 获取两点之间的方向
   */
  private getDirection(from: Position, to: Position): 'horizontal' | 'vertical' {
    if (from.row === to.row) {
      return 'horizontal'
    }
    return 'vertical'
  }

  /**
   * 简化路径（移除共线的中间点，只保留拐点）
   * @param path 原始路径
   * @returns 简化后的路径
   */
  simplifyPath(path: Path): Path {
    if (path.points.length <= 2) {
      return path
    }

    const simplified: Position[] = [path.points[0]]

    for (let i = 1; i < path.points.length - 1; i++) {
      const prev = path.points[i - 1]
      const curr = path.points[i]
      const next = path.points[i + 1]

      // 检查是否是拐点
      const dir1 = this.getDirection(prev, curr)
      const dir2 = this.getDirection(curr, next)

      if (dir1 !== dir2) {
        simplified.push(curr)
      }
    }

    simplified.push(path.points[path.points.length - 1])

    return {
      points: simplified,
      turns: path.turns
    }
  }
}
