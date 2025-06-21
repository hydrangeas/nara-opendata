import { describe, it, expect } from 'vitest'
import { RateLimit } from './RateLimit'

describe('RateLimit', () => {
  describe('create', () => {
    it('有効な値でRateLimitを作成できる', () => {
      const rateLimit = RateLimit.create(60, 60)
      expect(rateLimit.limit).toBe(60)
      expect(rateLimit.windowSeconds).toBe(60)
    })

    it('負の制限値を拒否する', () => {
      expect(() => RateLimit.create(-1, 60)).toThrow('Rate limit must be positive')
      expect(() => RateLimit.create(0, 60)).toThrow('Rate limit must be positive')
    })

    it('負のウィンドウ秒数を拒否する', () => {
      expect(() => RateLimit.create(60, -1)).toThrow('Window seconds must be positive')
      expect(() => RateLimit.create(60, 0)).toThrow('Window seconds must be positive')
    })

    it('小数の制限値を拒否する', () => {
      expect(() => RateLimit.create(60.5, 60)).toThrow('Rate limit must be an integer')
    })

    it('小数のウィンドウ秒数を拒否する', () => {
      expect(() => RateLimit.create(60, 60.5)).toThrow('Window seconds must be an integer')
    })
  })

  describe('requestsPerSecond', () => {
    it('1秒あたりのリクエスト数を正しく計算する', () => {
      const rateLimit1 = RateLimit.create(60, 60)
      expect(rateLimit1.requestsPerSecond).toBe(1)

      const rateLimit2 = RateLimit.create(120, 60)
      expect(rateLimit2.requestsPerSecond).toBe(2)

      const rateLimit3 = RateLimit.create(300, 60)
      expect(rateLimit3.requestsPerSecond).toBe(5)
    })
  })

  describe('equals', () => {
    it('同じ値のRateLimitは等しい', () => {
      const rateLimit1 = RateLimit.create(60, 60)
      const rateLimit2 = RateLimit.create(60, 60)

      expect(rateLimit1.equals(rateLimit2)).toBe(true)
    })

    it('異なる制限値のRateLimitは等しくない', () => {
      const rateLimit1 = RateLimit.create(60, 60)
      const rateLimit2 = RateLimit.create(120, 60)

      expect(rateLimit1.equals(rateLimit2)).toBe(false)
    })

    it('異なるウィンドウ秒数のRateLimitは等しくない', () => {
      const rateLimit1 = RateLimit.create(60, 60)
      const rateLimit2 = RateLimit.create(60, 120)

      expect(rateLimit1.equals(rateLimit2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('人間が読める文字列表現を返す', () => {
      const rateLimit = RateLimit.create(60, 60)
      expect(rateLimit.toString()).toBe('60 requests per 60 seconds')
    })
  })
})