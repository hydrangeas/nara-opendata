import { describe, it, expect } from 'vitest';
import {
  TierLevel,
  createUserTier,
  createUserTierFromString,
  getUserTierLevel,
  getUserTierDefaultRateLimit,
  equalsUserTier,
  userTierToString,
} from './UserTier';

describe('UserTier', () => {
  describe('createUserTier', () => {
    it('有効なTierLevelからUserTierを作成できる', () => {
      const tier1 = createUserTier(TierLevel.TIER1);
      const tier2 = createUserTier(TierLevel.TIER2);
      const tier3 = createUserTier(TierLevel.TIER3);

      expect(getUserTierLevel(tier1)).toBe(TierLevel.TIER1);
      expect(getUserTierLevel(tier2)).toBe(TierLevel.TIER2);
      expect(getUserTierLevel(tier3)).toBe(TierLevel.TIER3);
    });
  });

  describe('createUserTierFromString', () => {
    it('有効な文字列からUserTierを作成できる', () => {
      const tier1 = createUserTierFromString('TIER1');
      const tier2 = createUserTierFromString('TIER2');
      const tier3 = createUserTierFromString('TIER3');

      expect(getUserTierLevel(tier1)).toBe(TierLevel.TIER1);
      expect(getUserTierLevel(tier2)).toBe(TierLevel.TIER2);
      expect(getUserTierLevel(tier3)).toBe(TierLevel.TIER3);
    });

    it('無効な文字列を拒否する', () => {
      expect(() => createUserTierFromString('TIER4')).toThrow('Invalid tier level: TIER4');
      expect(() => createUserTierFromString('tier1')).toThrow('Invalid tier level: tier1');
      expect(() => createUserTierFromString('')).toThrow('Invalid tier level: ');
    });
  });

  describe('getUserTierDefaultRateLimit', () => {
    it('各ティアの正しいレート制限を返す', () => {
      const tier1 = createUserTier(TierLevel.TIER1);
      const tier2 = createUserTier(TierLevel.TIER2);
      const tier3 = createUserTier(TierLevel.TIER3);

      expect(getUserTierDefaultRateLimit(tier1)).toEqual({ limit: 60, windowSeconds: 60 });
      expect(getUserTierDefaultRateLimit(tier2)).toEqual({ limit: 120, windowSeconds: 60 });
      expect(getUserTierDefaultRateLimit(tier3)).toEqual({ limit: 300, windowSeconds: 60 });
    });
  });

  describe('equalsUserTier', () => {
    it('同じティアレベルのUserTierは等しい', () => {
      const tier1a = createUserTier(TierLevel.TIER1);
      const tier1b = createUserTier(TierLevel.TIER1);

      expect(equalsUserTier(tier1a, tier1b)).toBe(true);
    });

    it('異なるティアレベルのUserTierは等しくない', () => {
      const tier1 = createUserTier(TierLevel.TIER1);
      const tier2 = createUserTier(TierLevel.TIER2);

      expect(equalsUserTier(tier1, tier2)).toBe(false);
    });
  });

  describe('userTierToString', () => {
    it('ティアレベルの文字列表現を返す', () => {
      const tier1 = createUserTier(TierLevel.TIER1);
      const tier2 = createUserTier(TierLevel.TIER2);
      const tier3 = createUserTier(TierLevel.TIER3);

      expect(userTierToString(tier1)).toBe('TIER1');
      expect(userTierToString(tier2)).toBe('TIER2');
      expect(userTierToString(tier3)).toBe('TIER3');
    });
  });
});
