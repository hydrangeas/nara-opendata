import { describe, it, expect } from 'vitest';
import { createUserId, TierLevel } from '@nara-opendata/shared-kernel';
import {
  createAuthenticatedUser,
  getUserId,
  getRateLimit,
  equalsAuthenticatedUser,
} from './AuthenticatedUser';
import {
  RateLimitSource,
  createDefaultRateLimit,
  createCustomRateLimit,
  getRateLimitValue,
  getRateLimitWindowSeconds,
  getRateLimitSource,
} from './RateLimit';

describe('AuthenticatedUser', () => {
  const testUserId = createUserId('123e4567-e89b-12d3-a456-426614174000');

  describe('createAuthenticatedUser', () => {
    it('ユーザーIDとレート制限でユーザーを作成できる', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user = createAuthenticatedUser(testUserId, rateLimit);

      expect(getUserId(user)).toBe(testUserId);
      expect(getRateLimit(user)).toBe(rateLimit);
      expect(getRateLimitValue(getRateLimit(user))).toBe(60);
      expect(getRateLimitWindowSeconds(getRateLimit(user))).toBe(60);
      expect(getRateLimitSource(getRateLimit(user))).toBe(RateLimitSource.TIER1_DEFAULT);
    });

    it('各ティアのデフォルトレート制限でユーザーを作成できる', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1);
      const rateLimit2 = createDefaultRateLimit(TierLevel.TIER2);
      const rateLimit3 = createDefaultRateLimit(TierLevel.TIER3);

      const user1 = createAuthenticatedUser(testUserId, rateLimit1);
      const user2 = createAuthenticatedUser(testUserId, rateLimit2);
      const user3 = createAuthenticatedUser(testUserId, rateLimit3);

      expect(getRateLimitValue(getRateLimit(user1))).toBe(60);
      expect(getRateLimitSource(getRateLimit(user1))).toBe(RateLimitSource.TIER1_DEFAULT);
      expect(getRateLimitValue(getRateLimit(user2))).toBe(120);
      expect(getRateLimitSource(getRateLimit(user2))).toBe(RateLimitSource.TIER2_DEFAULT);
      expect(getRateLimitValue(getRateLimit(user3))).toBe(300);
      expect(getRateLimitSource(getRateLimit(user3))).toBe(RateLimitSource.TIER3_DEFAULT);
    });

    it('カスタムレート制限でユーザーを作成できる', () => {
      const customRateLimit = createCustomRateLimit(500, 60);
      const user = createAuthenticatedUser(testUserId, customRateLimit);

      expect(getUserId(user)).toBe(testUserId);
      expect(getRateLimit(user)).toBe(customRateLimit);
      expect(getRateLimitValue(getRateLimit(user))).toBe(500);
      expect(getRateLimitWindowSeconds(getRateLimit(user))).toBe(60);
      expect(getRateLimitSource(getRateLimit(user))).toBe(RateLimitSource.CUSTOM);
    });
  });

  describe('equalsAuthenticatedUser', () => {
    it('同じ属性のユーザーは等しい', () => {
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user1 = createAuthenticatedUser(testUserId, rateLimit);
      const user2 = createAuthenticatedUser(testUserId, rateLimit);

      expect(equalsAuthenticatedUser(user1, user2)).toBe(true);
    });

    it('異なるユーザーIDのユーザーは等しくない', () => {
      const otherId = createUserId('987f6543-e21b-12d3-a456-426614174000');
      const rateLimit = createDefaultRateLimit(TierLevel.TIER1);
      const user1 = createAuthenticatedUser(testUserId, rateLimit);
      const user2 = createAuthenticatedUser(otherId, rateLimit);

      expect(equalsAuthenticatedUser(user1, user2)).toBe(false);
    });

    it('異なるレート制限のユーザーは等しくない', () => {
      const rateLimit1 = createDefaultRateLimit(TierLevel.TIER1);
      const rateLimit2 = createDefaultRateLimit(TierLevel.TIER2);
      const user1 = createAuthenticatedUser(testUserId, rateLimit1);
      const user2 = createAuthenticatedUser(testUserId, rateLimit2);

      expect(equalsAuthenticatedUser(user1, user2)).toBe(false);
    });

    it('同じ値でも由来が異なるレート制限のユーザーは等しくない', () => {
      const defaultRateLimit = createDefaultRateLimit(TierLevel.TIER1); // 60/60s
      const customRateLimit = createCustomRateLimit(60, 60); // 同じ値だがカスタム
      const user1 = createAuthenticatedUser(testUserId, defaultRateLimit);
      const user2 = createAuthenticatedUser(testUserId, customRateLimit);

      expect(equalsAuthenticatedUser(user1, user2)).toBe(false);
    });
  });
});
