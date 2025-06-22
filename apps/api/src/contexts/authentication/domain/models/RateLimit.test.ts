import { describe, it, expect } from 'vitest';
import { RateLimit, RateLimitSource } from './RateLimit';

describe('RateLimit', () => {
  describe('createDefault', () => {
    it('TIER1のデフォルトレート制限を作成できる', () => {
      const rateLimit = RateLimit.createDefault('TIER1');
      expect(rateLimit.limit).toBe(60);
      expect(rateLimit.windowSeconds).toBe(60);
      expect(rateLimit.source).toBe(RateLimitSource.TIER1_DEFAULT);
      expect(rateLimit.isCustom).toBe(false);
    });

    it('TIER2のデフォルトレート制限を作成できる', () => {
      const rateLimit = RateLimit.createDefault('TIER2');
      expect(rateLimit.limit).toBe(120);
      expect(rateLimit.windowSeconds).toBe(60);
      expect(rateLimit.source).toBe(RateLimitSource.TIER2_DEFAULT);
      expect(rateLimit.isCustom).toBe(false);
    });

    it('TIER3のデフォルトレート制限を作成できる', () => {
      const rateLimit = RateLimit.createDefault('TIER3');
      expect(rateLimit.limit).toBe(300);
      expect(rateLimit.windowSeconds).toBe(60);
      expect(rateLimit.source).toBe(RateLimitSource.TIER3_DEFAULT);
      expect(rateLimit.isCustom).toBe(false);
    });

    it('無効なティアの場合エラーになる', () => {
      expect(() => RateLimit.createDefault('TIER99')).toThrow('Invalid tier level: TIER99');
    });
  });

  describe('createCustom', () => {
    it('カスタムレート制限を作成できる', () => {
      const rateLimit = RateLimit.createCustom(100, 60);
      expect(rateLimit.limit).toBe(100);
      expect(rateLimit.windowSeconds).toBe(60);
      expect(rateLimit.source).toBe(RateLimitSource.CUSTOM);
      expect(rateLimit.isCustom).toBe(true);
    });

    it('負の制限値を拒否する', () => {
      expect(() => RateLimit.createCustom(-1, 60)).toThrow('Rate limit must be positive');
      expect(() => RateLimit.createCustom(0, 60)).toThrow('Rate limit must be positive');
    });

    it('負のウィンドウ秒数を拒否する', () => {
      expect(() => RateLimit.createCustom(60, -1)).toThrow('Window seconds must be positive');
      expect(() => RateLimit.createCustom(60, 0)).toThrow('Window seconds must be positive');
    });

    it('小数の制限値を拒否する', () => {
      expect(() => RateLimit.createCustom(60.5, 60)).toThrow('Rate limit must be an integer');
    });

    it('小数のウィンドウ秒数を拒否する', () => {
      expect(() => RateLimit.createCustom(60, 60.5)).toThrow('Window seconds must be an integer');
    });
  });

  describe('requestsPerSecond', () => {
    it('1秒あたりのリクエスト数を正しく計算する', () => {
      const rateLimit1 = RateLimit.createCustom(60, 60);
      expect(rateLimit1.requestsPerSecond).toBe(1);

      const rateLimit2 = RateLimit.createCustom(120, 60);
      expect(rateLimit2.requestsPerSecond).toBe(2);

      const rateLimit3 = RateLimit.createCustom(300, 60);
      expect(rateLimit3.requestsPerSecond).toBe(5);
    });

    it('デフォルトレート制限でも正しく計算する', () => {
      const rateLimit = RateLimit.createDefault('TIER2');
      expect(rateLimit.requestsPerSecond).toBe(2); // 120/60
    });
  });

  describe('equals', () => {
    it('同じ値のカスタムRateLimitは等しい', () => {
      const rateLimit1 = RateLimit.createCustom(60, 60);
      const rateLimit2 = RateLimit.createCustom(60, 60);
      expect(rateLimit1.equals(rateLimit2)).toBe(true);
    });

    it('同じティアのデフォルトRateLimitは等しい', () => {
      const rateLimit1 = RateLimit.createDefault('TIER1');
      const rateLimit2 = RateLimit.createDefault('TIER1');
      expect(rateLimit1.equals(rateLimit2)).toBe(true);
    });

    it('同じ値でも由来が異なるRateLimitは等しくない', () => {
      const rateLimit1 = RateLimit.createDefault('TIER1'); // 60/60s
      const rateLimit2 = RateLimit.createCustom(60, 60); // 同じ値だがカスタム
      expect(rateLimit1.equals(rateLimit2)).toBe(false);
    });

    it('異なる制限値のRateLimitは等しくない', () => {
      const rateLimit1 = RateLimit.createCustom(60, 60);
      const rateLimit2 = RateLimit.createCustom(120, 60);
      expect(rateLimit1.equals(rateLimit2)).toBe(false);
    });

    it('異なるウィンドウ秒数のRateLimitは等しくない', () => {
      const rateLimit1 = RateLimit.createCustom(60, 60);
      const rateLimit2 = RateLimit.createCustom(60, 120);
      expect(rateLimit1.equals(rateLimit2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('人間が読める文字列表現を返す', () => {
      const rateLimit = RateLimit.createCustom(60, 60);
      expect(rateLimit.toString()).toBe('60 requests per 60 seconds');
    });
  });
});
