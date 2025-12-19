/**
 * Tests for DifficultyManager
 * 
 * Requirements: 7.1, 7.2
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  DifficultyManager, 
  CONSECUTIVE_THRESHOLD,
  INACTIVITY_TIMEOUT 
} from './DifficultyManager'

describe('DifficultyManager', () => {
  let difficultyManager: DifficultyManager

  beforeEach(() => {
    difficultyManager = new DifficultyManager()
  })

  describe('recordMatchResult - correct matches', () => {
    it('should increment consecutive correct count', () => {
      difficultyManager.recordMatchResult(true)
      
      expect(difficultyManager.getConsecutiveCorrect()).toBe(1)
      expect(difficultyManager.getConsecutiveWrong()).toBe(0)
    })

    it('should reset consecutive wrong count on correct match', () => {
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(true)
      
      expect(difficultyManager.getConsecutiveCorrect()).toBe(1)
      expect(difficultyManager.getConsecutiveWrong()).toBe(0)
    })

    it('should return "increase" after 3 consecutive correct matches', () => {
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      const result = difficultyManager.recordMatchResult(true)
      
      expect(result).toBe('increase')
    })

    it('should reset consecutive correct count after triggering increase', () => {
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      
      expect(difficultyManager.getConsecutiveCorrect()).toBe(0)
    })

    it('should return "none" before reaching threshold', () => {
      const result1 = difficultyManager.recordMatchResult(true)
      const result2 = difficultyManager.recordMatchResult(true)
      
      expect(result1).toBe('none')
      expect(result2).toBe('none')
    })
  })

  describe('recordMatchResult - wrong matches', () => {
    it('should increment consecutive wrong count', () => {
      difficultyManager.recordMatchResult(false)
      
      expect(difficultyManager.getConsecutiveWrong()).toBe(1)
      expect(difficultyManager.getConsecutiveCorrect()).toBe(0)
    })

    it('should reset consecutive correct count on wrong match', () => {
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(false)
      
      expect(difficultyManager.getConsecutiveWrong()).toBe(1)
      expect(difficultyManager.getConsecutiveCorrect()).toBe(0)
    })

    it('should return "decrease" after 3 consecutive wrong matches', () => {
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      const result = difficultyManager.recordMatchResult(false)
      
      expect(result).toBe('decrease')
    })

    it('should reset consecutive wrong count after triggering decrease', () => {
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      
      expect(difficultyManager.getConsecutiveWrong()).toBe(0)
    })
  })

  describe('callbacks', () => {
    it('should call onDifficultyIncrease after 3 consecutive correct', () => {
      const onIncrease = vi.fn()
      difficultyManager = new DifficultyManager({ onDifficultyIncrease: onIncrease })
      
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      
      expect(onIncrease).toHaveBeenCalledTimes(1)
    })

    it('should call onDifficultyDecrease after 3 consecutive wrong', () => {
      const onDecrease = vi.fn()
      difficultyManager = new DifficultyManager({ onDifficultyDecrease: onDecrease })
      
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      difficultyManager.recordMatchResult(false)
      
      expect(onDecrease).toHaveBeenCalledTimes(1)
    })
  })

  describe('inactivity detection', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should call onInactivityHint after timeout', () => {
      const onHint = vi.fn()
      difficultyManager = new DifficultyManager({ onInactivityHint: onHint })
      
      difficultyManager.startInactivityDetection()
      vi.advanceTimersByTime(INACTIVITY_TIMEOUT)
      
      expect(onHint).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on match result', () => {
      const onHint = vi.fn()
      difficultyManager = new DifficultyManager({ onInactivityHint: onHint })
      
      difficultyManager.startInactivityDetection()
      vi.advanceTimersByTime(INACTIVITY_TIMEOUT - 1000)
      difficultyManager.recordMatchResult(true)
      vi.advanceTimersByTime(INACTIVITY_TIMEOUT - 1000)
      
      expect(onHint).not.toHaveBeenCalled()
    })

    it('should stop detection when stopped', () => {
      const onHint = vi.fn()
      difficultyManager = new DifficultyManager({ onInactivityHint: onHint })
      
      difficultyManager.startInactivityDetection()
      difficultyManager.stopInactivityDetection()
      vi.advanceTimersByTime(INACTIVITY_TIMEOUT * 2)
      
      expect(onHint).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('should reset all state', () => {
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(false)
      
      difficultyManager.reset()
      
      expect(difficultyManager.getConsecutiveCorrect()).toBe(0)
      expect(difficultyManager.getConsecutiveWrong()).toBe(0)
    })
  })

  describe('getState', () => {
    it('should return a copy of the state', () => {
      difficultyManager.recordMatchResult(true)
      difficultyManager.recordMatchResult(true)
      
      const state = difficultyManager.getState()
      
      expect(state.consecutiveCorrect).toBe(2)
      expect(state.consecutiveWrong).toBe(0)
      expect(state.lastActionTime).toBeGreaterThan(0)
    })
  })

  describe('restoreFromState', () => {
    it('should restore state correctly', () => {
      const savedState = {
        consecutiveCorrect: 2,
        consecutiveWrong: 0,
        lastActionTime: Date.now() - 10000
      }
      
      difficultyManager.restoreFromState(savedState)
      
      expect(difficultyManager.getConsecutiveCorrect()).toBe(2)
      expect(difficultyManager.getConsecutiveWrong()).toBe(0)
    })
  })

  describe('static methods', () => {
    describe('shouldIncreaseDifficulty', () => {
      it('should return true when threshold reached', () => {
        expect(DifficultyManager.shouldIncreaseDifficulty(3)).toBe(true)
        expect(DifficultyManager.shouldIncreaseDifficulty(5)).toBe(true)
      })

      it('should return false when below threshold', () => {
        expect(DifficultyManager.shouldIncreaseDifficulty(0)).toBe(false)
        expect(DifficultyManager.shouldIncreaseDifficulty(2)).toBe(false)
      })
    })

    describe('shouldDecreaseDifficulty', () => {
      it('should return true when threshold reached', () => {
        expect(DifficultyManager.shouldDecreaseDifficulty(3)).toBe(true)
        expect(DifficultyManager.shouldDecreaseDifficulty(5)).toBe(true)
      })

      it('should return false when below threshold', () => {
        expect(DifficultyManager.shouldDecreaseDifficulty(0)).toBe(false)
        expect(DifficultyManager.shouldDecreaseDifficulty(2)).toBe(false)
      })
    })

    describe('calculateAdjustmentFromSequence', () => {
      it('should return "increase" for 3 consecutive correct', () => {
        expect(DifficultyManager.calculateAdjustmentFromSequence([true, true, true])).toBe('increase')
      })

      it('should return "decrease" for 3 consecutive wrong', () => {
        expect(DifficultyManager.calculateAdjustmentFromSequence([false, false, false])).toBe('decrease')
      })

      it('should return "none" for mixed results', () => {
        expect(DifficultyManager.calculateAdjustmentFromSequence([true, false, true])).toBe('none')
        expect(DifficultyManager.calculateAdjustmentFromSequence([true, true, false])).toBe('none')
      })

      it('should return "none" for empty sequence', () => {
        expect(DifficultyManager.calculateAdjustmentFromSequence([])).toBe('none')
      })

      it('should detect first trigger in sequence', () => {
        // First 3 correct triggers increase, even if followed by wrong
        expect(DifficultyManager.calculateAdjustmentFromSequence([true, true, true, false])).toBe('increase')
      })
    })
  })

  describe('CONSECUTIVE_THRESHOLD constant', () => {
    it('should be 3', () => {
      expect(CONSECUTIVE_THRESHOLD).toBe(3)
    })
  })
})
