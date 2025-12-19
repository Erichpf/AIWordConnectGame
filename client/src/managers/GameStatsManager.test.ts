/**
 * Tests for GameStatsManager
 * 
 * Requirements: 6.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GameStatsManager } from './GameStatsManager'

describe('GameStatsManager', () => {
  let statsManager: GameStatsManager

  beforeEach(() => {
    statsManager = new GameStatsManager()
  })

  describe('recordMatch', () => {
    it('should increment correct count for correct matches', () => {
      statsManager.recordMatch('学习', 'study', true)
      
      expect(statsManager.getCorrectCount()).toBe(1)
      expect(statsManager.getWrongCount()).toBe(0)
    })

    it('should increment wrong count for incorrect matches', () => {
      statsManager.recordMatch('学习', 'growth', false)
      
      expect(statsManager.getCorrectCount()).toBe(0)
      expect(statsManager.getWrongCount()).toBe(1)
    })

    it('should track multiple matches correctly', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'growth', true)
      statsManager.recordMatch('品德', 'wrong', false)
      
      expect(statsManager.getCorrectCount()).toBe(2)
      expect(statsManager.getWrongCount()).toBe(1)
    })

    it('should add match to history', () => {
      statsManager.recordMatch('学习', 'study', true)
      
      const history = statsManager.getMatchHistory()
      expect(history).toHaveLength(1)
      expect(history[0].word).toBe('学习')
      expect(history[0].meaning).toBe('study')
      expect(history[0].isCorrect).toBe(true)
      expect(history[0].timestamp).toBeGreaterThan(0)
    })
  })

  describe('getScore', () => {
    it('should return a copy of the score', () => {
      statsManager.recordMatch('学习', 'study', true)
      
      const score = statsManager.getScore()
      score.correct = 100 // Modify the copy
      
      expect(statsManager.getCorrectCount()).toBe(1) // Original unchanged
    })
  })

  describe('timer functions', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should track elapsed time when started', () => {
      statsManager.startTimer()
      
      vi.advanceTimersByTime(5000) // 5 seconds
      
      expect(statsManager.getElapsedTime()).toBe(5)
    })

    it('should pause timer correctly', () => {
      statsManager.startTimer()
      vi.advanceTimersByTime(3000)
      statsManager.pauseTimer()
      vi.advanceTimersByTime(5000) // Should not count
      
      expect(statsManager.getElapsedTime()).toBe(3)
    })

    it('should resume timer from paused state', () => {
      statsManager.startTimer()
      vi.advanceTimersByTime(3000)
      statsManager.pauseTimer()
      vi.advanceTimersByTime(2000) // Not counted
      statsManager.startTimer()
      vi.advanceTimersByTime(2000)
      
      expect(statsManager.getElapsedTime()).toBe(5)
    })
  })

  describe('reset', () => {
    it('should reset all statistics', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'wrong', false)
      statsManager.setElapsedTime(100)
      
      statsManager.reset()
      
      expect(statsManager.getCorrectCount()).toBe(0)
      expect(statsManager.getWrongCount()).toBe(0)
      expect(statsManager.getElapsedTime()).toBe(0)
      expect(statsManager.getMatchHistory()).toHaveLength(0)
    })
  })

  describe('getGameResult', () => {
    it('should return complete game result', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'growth', true)
      statsManager.recordMatch('品德', 'wrong', false)
      statsManager.setElapsedTime(120)
      
      const result = statsManager.getGameResult()
      
      expect(result.correct).toBe(2)
      expect(result.wrong).toBe(1)
      expect(result.duration).toBe(120)
      expect(result.matchHistory).toHaveLength(3)
    })
  })

  describe('restoreFromState', () => {
    it('should restore score and elapsed time', () => {
      statsManager.restoreFromState(
        { correct: 5, wrong: 2 },
        180
      )
      
      expect(statsManager.getCorrectCount()).toBe(5)
      expect(statsManager.getWrongCount()).toBe(2)
      expect(statsManager.getElapsedTime()).toBe(180)
    })

    it('should restore match history if provided', () => {
      const history = [
        { word: '学习', meaning: 'study', isCorrect: true, timestamp: 1000 }
      ]
      
      statsManager.restoreFromState(
        { correct: 1, wrong: 0 },
        60,
        history
      )
      
      expect(statsManager.getMatchHistory()).toHaveLength(1)
      expect(statsManager.getMatchHistory()[0].word).toBe('学习')
    })
  })

  describe('getAccuracy', () => {
    it('should return 0 when no matches', () => {
      expect(statsManager.getAccuracy()).toBe(0)
    })

    it('should calculate accuracy correctly', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'growth', true)
      statsManager.recordMatch('品德', 'wrong', false)
      statsManager.recordMatch('科技', 'wrong', false)
      
      expect(statsManager.getAccuracy()).toBe(0.5)
    })

    it('should return 1 for all correct', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'growth', true)
      
      expect(statsManager.getAccuracy()).toBe(1)
    })
  })

  describe('getAverageTimePerMatch', () => {
    it('should return 0 when no matches', () => {
      expect(statsManager.getAverageTimePerMatch()).toBe(0)
    })

    it('should calculate average time correctly', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'growth', true)
      statsManager.setElapsedTime(60)
      
      expect(statsManager.getAverageTimePerMatch()).toBe(30)
    })
  })

  describe('calculateStatsFromHistory', () => {
    it('should calculate stats from history', () => {
      const history = [
        { word: '学习', meaning: 'study', isCorrect: true, timestamp: 1000 },
        { word: '成长', meaning: 'growth', isCorrect: true, timestamp: 2000 },
        { word: '品德', meaning: 'wrong', isCorrect: false, timestamp: 3000 }
      ]
      
      const stats = GameStatsManager.calculateStatsFromHistory(history)
      
      expect(stats.correct).toBe(2)
      expect(stats.wrong).toBe(1)
    })

    it('should return zeros for empty history', () => {
      const stats = GameStatsManager.calculateStatsFromHistory([])
      
      expect(stats.correct).toBe(0)
      expect(stats.wrong).toBe(0)
    })
  })

  describe('validateStats', () => {
    it('should return true when stats match history', () => {
      statsManager.recordMatch('学习', 'study', true)
      statsManager.recordMatch('成长', 'wrong', false)
      
      expect(statsManager.validateStats()).toBe(true)
    })
  })
})
