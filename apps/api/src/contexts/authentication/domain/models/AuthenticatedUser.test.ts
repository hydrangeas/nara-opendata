import { describe, it, expect } from 'vitest';
import { createUserId, TierLevel } from '@nara-opendata/shared-kernel';
import { AuthenticatedUser } from './AuthenticatedUser';
import {
  RateLimitSource,
  createDefaultRateLimit,
  createCustomRateLimit,
  getRateLimitValue,
  getRateLimitWindowSeconds,
  getRateLimitSource,
  isCustomRateLimit,
} from './RateLimit';

describe('AuthenticatedUser', () => {
  const testUserId = createUserId('123e4567-e89b-12d3-a456-426614174000');

  describe('create', () => {
    it('ユーザーIDとレート制限でユーザーを作成できる', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user = AuthenticatedUser.create(testUserId, rateLimit);

      expect(user.userId).toBe(testUserId);
      expect(user.rateLimit).toBe(rateLimit);
      expect(getRateLimitValue(user.rateLimit)).toBe(60);
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
    });

    it('各ティアのデフォルトレート制限でユーザーを作成できる', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1);
      const rateLimit2 = createDefaultRateLimit(TierLevel.TIER2);
      const rateLimit3 = createDefaultRateLimit(TierLevel.TIER3);

      const user1 = AuthenticatedUser.create(testUserId, rateLimit1);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit2);
      const user3 = AuthenticatedUser.create(testUserId, rateLimit3);

      expect(getRateLimitValue(user1.rateLimit)).toBe(60);
      expect(getRateLimitSource(user1.rateLimit)).toBe(RateLimitSource.TIER1_DEFAULT);
      expect(getRateLimitValue(user2.rateLimit)).toBe(120);
      expect(getRateLimitSource(user2.rateLimit)).toBe(RateLimitSource.TIER2_DEFAULT);
      expect(getRateLimitValue(user3.rateLimit)).toBe(300);
      expect(getRateLimitSource(user3.rateLimit)).toBe(RateLimitSource.TIER3_DEFAULT);
    });

    it('カスタムレート制限でユーザーを作成できる', () => {
      const customRateLimit = createCustomRateLimit(500, 60);
      const user = AuthenticatedUser.create(testUserId, customRateLimit);

      expect(user.userId).toBe(testUserId);
      expect(user.rateLimit).toBe(customRateLimit);
      expect(getRateLimitValue(user.rateLimit)).toBe(500);
      expect(getRateLimitWindowSeconds(user.rateLimit)).toBe(60);
      expect(getRateLimitSource(user.rateLimit)).toBe(RateLimitSource.CUSTOM);
      expect(isCustomRateLimit(user.rateLimit)).toBe(true);
    });
  });

  describe('equals', () => {
    it('同じ属性のユーザーは等しい', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user1 = AuthenticatedUser.create(testUserId, rateLimit);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit);

      expect(user1.equals(user2)).toBe(true);
    });

    it('異なるユーザーIDのユーザーは等しくない', () => {
      const otherId = createUserId('987f6543-e21b-12d3-a456-426614174000');
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user1 = AuthenticatedUser.create(testUserId, rateLimit);
      const user2 = AuthenticatedUser.create(otherId, rateLimit);

      expect(user1.equals(user2)).toBe(false);
    });

    it('異なるレート制限のユーザーは等しくない', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1);
      const rateLimit2 = createDefaultRateLimit(TierLevel.TIER2);
      const user1 = AuthenticatedUser.create(testUserId, rateLimit1);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit2);

      expect(user1.equals(user2)).toBe(false);
    });

    it('同じ値でも由来が異なるレート制限のユーザーは等しくない', () => {
      const defaultRateLimit = createDefaultRateLimit(TierLevel.TIER1); // 60/60s
      const customRateLimit = createCustomRateLimit(60, 60); // 同じ値だがカスタム
      const user1 = AuthenticatedUser.create(testUserId, defaultRateLimit);
      const user2 = AuthenticatedUser.create(testUserId, customRateLimit);

      expect(user1.equals(user2)).toBe(false);
    });
  });
});
