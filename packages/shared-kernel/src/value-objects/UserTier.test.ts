import { describe, it, expect } from 'vitest'
import { UserTier, TierLevel } from './UserTier'

describe('UserTier', () => {
  describe('create', () => {
    it('有効なTierLevelからUserTierを作成できる', () => {
      const tier1 = UserTier.create(TierLevel.TIER1)
      const tier2 = UserTier.create(TierLevel.TIER2)
      const tier3 = UserTier.create(TierLevel.TIER3)

      expect(tier1.level).toBe(TierLevel.TIER1)
      expect(tier2.level).toBe(TierLevel.TIER2)
      expect(tier3.level).toBe(TierLevel.TIER3)
    })
  })

  describe('fromString', () => {
    it('有効な文字列からUserTierを作成できる', () => {
      const tier1 = UserTier.fromString('TIER1')
      const tier2 = UserTier.fromString('TIER2')
      const tier3 = UserTier.fromString('TIER3')

      expect(tier1.level).toBe(TierLevel.TIER1)
      expect(tier2.level).toBe(TierLevel.TIER2)
      expect(tier3.level).toBe(TierLevel.TIER3)
    })

    it('無効な文字列を拒否する', () => {
      expect(() => UserTier.fromString('TIER4')).toThrow('Invalid tier level: TIER4')
      expect(() => UserTier.fromString('tier1')).toThrow('Invalid tier level: tier1')
      expect(() => UserTier.fromString('')).toThrow('Invalid tier level: ')
    })
  })

  describe('defaultRateLimit', () => {
    it('各ティアの正しいレート制限を返す', () => {
      const tier1 = UserTier.create(TierLevel.TIER1)
      const tier2 = UserTier.create(TierLevel.TIER2)
      const tier3 = UserTier.create(TierLevel.TIER3)

      expect(tier1.defaultRateLimit).toEqual({ limit: 60, windowSeconds: 60 })
      expect(tier2.defaultRateLimit).toEqual({ limit: 120, windowSeconds: 60 })
      expect(tier3.defaultRateLimit).toEqual({ limit: 300, windowSeconds: 60 })
    })
  })

  describe('equals', () => {
    it('同じティアレベルのUserTierは等しい', () => {
      const tier1a = UserTier.create(TierLevel.TIER1)
      const tier1b = UserTier.create(TierLevel.TIER1)

      expect(tier1a.equals(tier1b)).toBe(true)
    })

    it('異なるティアレベルのUserTierは等しくない', () => {
      const tier1 = UserTier.create(TierLevel.TIER1)
      const tier2 = UserTier.create(TierLevel.TIER2)

      expect(tier1.equals(tier2)).toBe(false)
    })
  })

  describe('toString', () => {
    it('ティアレベルの文字列表現を返す', () => {
      const tier1 = UserTier.create(TierLevel.TIER1)
      const tier2 = UserTier.create(TierLevel.TIER2)
      const tier3 = UserTier.create(TierLevel.TIER3)

      expect(tier1.toString()).toBe('TIER1')
      expect(tier2.toString()).toBe('TIER2')
      expect(tier3.toString()).toBe('TIER3')
    })
  })
})