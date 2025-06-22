import { describe, it, expect } from 'vitest';
import {
  TierLevel,
  createUserTier,
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

  describe('getUserTierDefaultRateLimit', () => {
    it('各ティアの正しいレート制限を返す', () => {
      const tier1 = createUserTier(TierLevel.TIER1);
      const tier2 = createUserTier(TierLevel.TIER2);
      const tier3 = createUserTier(TierLevel.TIER3);

      const rateLimit1 = getUserTierDefaultRateLimit(tier1);
      const rateLimit2 = getUserTierDefaultRateLimit(tier2);
      const rateLimit3 = getUserTierDefaultRateLimit(tier3);

      // 戻り値が正しい型を持つことを確認（TypeScriptの型推論をテスト）
      expect(rateLimit1.limit).toBe(60);
      expect(rateLimit1.windowSeconds).toBe(60);

      expect(rateLimit2.limit).toBe(120);
      expect(rateLimit2.windowSeconds).toBe(60);

      expect(rateLimit3.limit).toBe(300);
      expect(rateLimit3.windowSeconds).toBe(60);
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
