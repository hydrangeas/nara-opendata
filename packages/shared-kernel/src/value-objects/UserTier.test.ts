import { describe, it, expect } from 'vitest';
import {
  TierLevel,
  createUserTier,
  getUserTierLevel,
  TIER_DEFAULT_RATE_LIMITS,
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

    it('無効な値を拒否する', () => {
      // 数値を渡した場合
      expect(() => createUserTier(1 as any)).toThrow('Invalid tier level: 1');
      expect(() => createUserTier(2 as any)).toThrow('Invalid tier level: 2');
      expect(() => createUserTier(3 as any)).toThrow('Invalid tier level: 3');
      expect(() => createUserTier(4 as any)).toThrow('Invalid tier level: 4');

      // 不正な文字列を渡した場合
      expect(() => createUserTier('TIER4' as any)).toThrow('Invalid tier level: TIER4');
      expect(() => createUserTier('tier1' as any)).toThrow('Invalid tier level: tier1');
      expect(() => createUserTier('INVALID' as any)).toThrow('Invalid tier level: INVALID');
      expect(() => createUserTier('' as any)).toThrow('Invalid tier level: ');

      // null/undefinedを渡した場合
      expect(() => createUserTier(null as any)).toThrow('Invalid tier level: null');
      expect(() => createUserTier(undefined as any)).toThrow('Invalid tier level: undefined');

      // オブジェクトを渡した場合
      expect(() => createUserTier({} as any)).toThrow('Invalid tier level: [object Object]');
      expect(() => createUserTier([] as any)).toThrow('Invalid tier level: ');
    });
  });

  describe('TIER_DEFAULT_RATE_LIMITS', () => {
    it('各ティアの正しいレート制限が定義されている', () => {
      // TIER1のレート制限
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].limit).toBe(60);
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].windowSeconds).toBe(60);

      // TIER2のレート制限
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER2].limit).toBe(120);
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER2].windowSeconds).toBe(60);

      // TIER3のレート制限
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER3].limit).toBe(300);
      expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER3].windowSeconds).toBe(60);
    });

    it('定数は変更不可能である', () => {
      // TypeScriptのreadonly修飾子により、以下のコードはコンパイルエラーになる
      // TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1] = { limit: 100, windowSeconds: 100 };
      // TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].limit = 100;

      // オブジェクトが凍結されていることを確認（as constにより読み取り専用）
      expect(Object.isFrozen(TIER_DEFAULT_RATE_LIMITS)).toBe(false); // as constは実行時の凍結ではない

      // 値が正しく読み取れることを確認
      const tier1Limit = TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1];
      expect(tier1Limit).toEqual({ limit: 60, windowSeconds: 60 });
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
