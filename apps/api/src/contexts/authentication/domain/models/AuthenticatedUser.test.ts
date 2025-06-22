import { describe, it, expect } from 'vitest';
import { createUserId } from '@nara-opendata/shared-kernel';
import { AuthenticatedUser } from './AuthenticatedUser';
import { RateLimit, RateLimitSource } from './RateLimit';

describe('AuthenticatedUser', () => {
  const testUserId = createUserId('123e4567-e89b-12d3-a456-426614174000');

  describe('create', () => {
    it('ユーザーIDとレート制限でユーザーを作成できる', () => {
      const rateLimit = RateLimit.createDefault('TIER1');
      const user = AuthenticatedUser.create(testUserId, rateLimit);

      expect(user.userId).toBe(testUserId);
      expect(user.rateLimit).toBe(rateLimit);
      expect(user.rateLimit.limit).toBe(60);
      expect(user.rateLimit.windowSeconds).toBe(60);
      expect(user.rateLimit.source).toBe(RateLimitSource.TIER1_DEFAULT);
    });

    it('各ティアのデフォルトレート制限でユーザーを作成できる', () => {
      const rateLimit1 = RateLimit.createDefault('TIER1');
      const rateLimit2 = RateLimit.createDefault('TIER2');
      const rateLimit3 = RateLimit.createDefault('TIER3');

      const user1 = AuthenticatedUser.create(testUserId, rateLimit1);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit2);
      const user3 = AuthenticatedUser.create(testUserId, rateLimit3);

      expect(user1.rateLimit.limit).toBe(60);
      expect(user1.rateLimit.source).toBe(RateLimitSource.TIER1_DEFAULT);
      expect(user2.rateLimit.limit).toBe(120);
      expect(user2.rateLimit.source).toBe(RateLimitSource.TIER2_DEFAULT);
      expect(user3.rateLimit.limit).toBe(300);
      expect(user3.rateLimit.source).toBe(RateLimitSource.TIER3_DEFAULT);
    });

    it('カスタムレート制限でユーザーを作成できる', () => {
      const customRateLimit = RateLimit.createCustom(500, 60);
      const user = AuthenticatedUser.create(testUserId, customRateLimit);

      expect(user.userId).toBe(testUserId);
      expect(user.rateLimit).toBe(customRateLimit);
      expect(user.rateLimit.limit).toBe(500);
      expect(user.rateLimit.windowSeconds).toBe(60);
      expect(user.rateLimit.source).toBe(RateLimitSource.CUSTOM);
      expect(user.rateLimit.isCustom).toBe(true);
    });
  });

  describe('equals', () => {
    it('同じ属性のユーザーは等しい', () => {
      const rateLimit = RateLimit.createDefault('TIER1');
      const user1 = AuthenticatedUser.create(testUserId, rateLimit);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit);

      expect(user1.equals(user2)).toBe(true);
    });

    it('異なるユーザーIDのユーザーは等しくない', () => {
      const otherId = createUserId('987f6543-e21b-12d3-a456-426614174000');
      const rateLimit = RateLimit.createDefault('TIER1');
      const user1 = AuthenticatedUser.create(testUserId, rateLimit);
      const user2 = AuthenticatedUser.create(otherId, rateLimit);

      expect(user1.equals(user2)).toBe(false);
    });

    it('異なるレート制限のユーザーは等しくない', () => {
      const rateLimit1 = RateLimit.createDefault('TIER1');
      const rateLimit2 = RateLimit.createDefault('TIER2');
      const user1 = AuthenticatedUser.create(testUserId, rateLimit1);
      const user2 = AuthenticatedUser.create(testUserId, rateLimit2);

      expect(user1.equals(user2)).toBe(false);
    });

    it('同じ値でも由来が異なるレート制限のユーザーは等しくない', () => {
      const defaultRateLimit = RateLimit.createDefault('TIER1'); // 60/60s
      const customRateLimit = RateLimit.createCustom(60, 60); // 同じ値だがカスタム
      const user1 = AuthenticatedUser.create(testUserId, defaultRateLimit);
      const user2 = AuthenticatedUser.create(testUserId, customRateLimit);

      expect(user1.equals(user2)).toBe(false);
    });
  });
});
