import { describe, it, expect } from 'vitest';
import { TierLevel } from '@nara-opendata/shared-kernel';
import {
  RateLimitSource,
  createDefaultRateLimit,
  createCustomRateLimit,
  getRateLimitValue,
  getRateLimitWindowSeconds,
  getRateLimitSource,
  getRateLimitRequestsPerSecond,
  isCustomRateLimit,
  equalsRateLimit,
  rateLimitToString,
} from './RateLimit';

describe('RateLimit', () => {
  describe('createDefaultRateLimit', () => {
    it('TIER1のデフォルトレート制限を作成できる', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      expect(getRateLimitValue(rateLimit)).toBe(60);
      expect(getRateLimitWindowSeconds(rateLimit)).toBe(60);
      expect(getRateLimitSource(rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
      expect(isCustomRateLimit(rateLimit)).toBe(false);
    });

    it('TIER2のデフォルトレート制限を作成できる', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER2);
      expect(getRateLimitValue(rateLimit)).toBe(120);
      expect(getRateLimitWindowSeconds(rateLimit)).toBe(60);
      expect(getRateLimitSource(rateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);
      expect(isCustomRateLimit(rateLimit)).toBe(false);
    });

    it('TIER3のデフォルトレート制限を作成できる', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER3);
      expect(getRateLimitValue(rateLimit)).toBe(300);
      expect(getRateLimitWindowSeconds(rateLimit)).toBe(60);
      expect(getRateLimitSource(rateLimit)).toBe(RateLimitSource.TIER3_DEFAULT);
      expect(isCustomRateLimit(rateLimit)).toBe(false);
    });
  });

  describe('createCustomRateLimit', () => {
    it('カスタムレート制限を作成できる', () => {
      const rateLimit = createCustomRateLimit(100, 60);
      expect(getRateLimitValue(rateLimit)).toBe(100);
      expect(getRateLimitWindowSeconds(rateLimit)).toBe(60);
      expect(getRateLimitSource(rateLimit)).toBe(RateLimitSource.CUSTOM);
      expect(isCustomRateLimit(rateLimit)).toBe(true);
    });

    it('負の制限値を拒否する', () => {
      expect(() => createCustomRateLimit(-1, 60)).toThrow('Rate limit must be positive');
      expect(() => createCustomRateLimit(0, 60)).toThrow('Rate limit must be positive');
    });

    it('負のウィンドウ秒数を拒否する', () => {
      expect(() => createCustomRateLimit(60, -1)).toThrow('Window seconds must be positive');
      expect(() => createCustomRateLimit(60, 0)).toThrow('Window seconds must be positive');
    });

    it('小数の制限値を拒否する', () => {
      expect(() => createCustomRateLimit(60.5, 60)).toThrow('Rate limit must be an integer');
    });

    it('小数のウィンドウ秒数を拒否する', () => {
      expect(() => createCustomRateLimit(60, 60.5)).toThrow('Window seconds must be an integer');
    });
  });

  describe('getRateLimitRequestsPerSecond', () => {
    it('1秒あたりのリクエスト数を正しく計算する', () => {
      const rateLimit1 = createCustomRateLimit(60, 60);
      expect(getRateLimitRequestsPerSecond(rateLimit1)).toBe(1);

      const rateLimit2 = createCustomRateLimit(120, 60);
      expect(getRateLimitRequestsPerSecond(rateLimit2)).toBe(2);

      const rateLimit3 = createCustomRateLimit(300, 60);
      expect(getRateLimitRequestsPerSecond(rateLimit3)).toBe(5);
    });

    it('デフォルトレート制限でも正しく計算する', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER2);
      expect(getRateLimitRequestsPerSecond(rateLimit)).toBe(2); // 120/60
    });
  });

  describe('equalsRateLimit', () => {
    it('同じ値のカスタムRateLimitは等しい', () => {
      const rateLimit1 = createCustomRateLimit(60, 60);
      const rateLimit2 = createCustomRateLimit(60, 60);
      expect(equalsRateLimit(rateLimit1, rateLimit2)).toBe(true);
    });

    it('同じティアのデフォルトRateLimitは等しい', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1);
      const rateLimit2 = createDefaultRateLimit(TierLevel.TIER1);
      expect(equalsRateLimit(rateLimit1, rateLimit2)).toBe(true);
    });

    it('同じ値でも由来が異なるRateLimitは等しくない', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1); // 60/60s
      const rateLimit2 = createCustomRateLimit(60, 60); // 同じ値だがカスタム
      expect(equalsRateLimit(rateLimit1, rateLimit2)).toBe(false);
    });

    it('異なる制限値のRateLimitは等しくない', () => {
      const rateLimit1 = createCustomRateLimit(60, 60);
      const rateLimit2 = createCustomRateLimit(120, 60);
      expect(equalsRateLimit(rateLimit1, rateLimit2)).toBe(false);
    });

    it('異なるウィンドウ秒数のRateLimitは等しくない', () => {
      const rateLimit1 = createCustomRateLimit(60, 60);
      const rateLimit2 = createCustomRateLimit(60, 120);
      expect(equalsRateLimit(rateLimit1, rateLimit2)).toBe(false);
    });
  });

  describe('rateLimitToString', () => {
    it('人間が読める文字列表現を返す', () => {
      const rateLimit = createCustomRateLimit(60, 60);
      expect(rateLimitToString(rateLimit)).toBe('60 requests per 60 seconds');
    });
  });
});
