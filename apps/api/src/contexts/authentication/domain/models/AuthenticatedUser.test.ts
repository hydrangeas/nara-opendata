import { describe, it, expect } from 'vitest';
import { createUserId, UserTier, TierLevel } from '@nara-opendata/shared-kernel';
import { AuthenticatedUser } from './AuthenticatedUser';
import { RateLimit } from './RateLimit';

describe('AuthenticatedUser', () => {
  const testUserId = createUserId('123e4567-e89b-12d3-a456-426614174000');
  const tier1 = UserTier.create(TierLevel.TIER1);
  const tier2 = UserTier.create(TierLevel.TIER2);
  const tier3 = UserTier.create(TierLevel.TIER3);

  describe('create', () => {
    it('デフォルトレート制限でユーザーを作成できる', () => {
      const user = AuthenticatedUser.create(testUserId, tier1);

      expect(user.userId).toBe(testUserId);
      expect(user.userTier).toBe(tier1);
      expect(user.rateLimit.limit).toBe(60);
      expect(user.rateLimit.windowSeconds).toBe(60);
      expect(user.hasCustomRateLimit).toBe(false);
    });

    it('各ティアに応じたデフォルトレート制限が設定される', () => {
      const user1 = AuthenticatedUser.create(testUserId, tier1);
      const user2 = AuthenticatedUser.create(testUserId, tier2);
      const user3 = AuthenticatedUser.create(testUserId, tier3);

      expect(user1.rateLimit.limit).toBe(60);
      expect(user2.rateLimit.limit).toBe(120);
      expect(user3.rateLimit.limit).toBe(300);
    });
  });

  describe('createWithCustomRateLimit', () => {
    it('カスタムレート制限でユーザーを作成できる', () => {
      const customRateLimit = RateLimit.create(500, 60);
      const user = AuthenticatedUser.createWithCustomRateLimit(testUserId, tier1, customRateLimit);

      expect(user.userId).toBe(testUserId);
      expect(user.userTier).toBe(tier1);
      expect(user.rateLimit).toBe(customRateLimit);
      expect(user.hasCustomRateLimit).toBe(true);
    });
  });

  describe('equals', () => {
    it('同じ属性のユーザーは等しい', () => {
      const user1 = AuthenticatedUser.create(testUserId, tier1);
      const user2 = AuthenticatedUser.create(testUserId, tier1);

      expect(user1.equals(user2)).toBe(true);
    });

    it('異なるユーザーIDのユーザーは等しくない', () => {
      const otherId = createUserId('987f6543-e21b-12d3-a456-426614174000');
      const user1 = AuthenticatedUser.create(testUserId, tier1);
      const user2 = AuthenticatedUser.create(otherId, tier1);

      expect(user1.equals(user2)).toBe(false);
    });

    it('異なるティアのユーザーは等しくない', () => {
      const user1 = AuthenticatedUser.create(testUserId, tier1);
      const user2 = AuthenticatedUser.create(testUserId, tier2);

      expect(user1.equals(user2)).toBe(false);
    });

    it('異なるレート制限のユーザーは等しくない', () => {
      const customRateLimit = RateLimit.create(100, 60);
      const user1 = AuthenticatedUser.create(testUserId, tier1);
      const user2 = AuthenticatedUser.createWithCustomRateLimit(testUserId, tier1, customRateLimit);

      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('withRateLimit', () => {
    it('レート制限を変更した新しいインスタンスを作成する', () => {
      const user = AuthenticatedUser.create(testUserId, tier1);
      const newRateLimit = RateLimit.create(100, 60);
      const updatedUser = user.withRateLimit(newRateLimit);

      expect(updatedUser.userId).toBe(testUserId);
      expect(updatedUser.userTier).toBe(tier1);
      expect(updatedUser.rateLimit).toBe(newRateLimit);
      expect(updatedUser.hasCustomRateLimit).toBe(true);

      // 元のインスタンスは変更されない
      expect(user.rateLimit.limit).toBe(60);
      expect(user.hasCustomRateLimit).toBe(false);
    });
  });

  describe('withTier', () => {
    it('ティアを変更した新しいインスタンスを作成する', () => {
      const user = AuthenticatedUser.create(testUserId, tier1);
      const updatedUser = user.withTier(tier2);

      expect(updatedUser.userId).toBe(testUserId);
      expect(updatedUser.userTier).toBe(tier2);
      expect(updatedUser.rateLimit.limit).toBe(120); // tier2のデフォルト
      expect(updatedUser.hasCustomRateLimit).toBe(false);

      // 元のインスタンスは変更されない
      expect(user.userTier).toBe(tier1);
    });

    it('カスタムレート制限があってもデフォルトに戻る', () => {
      const customRateLimit = RateLimit.create(500, 60);
      const user = AuthenticatedUser.createWithCustomRateLimit(testUserId, tier1, customRateLimit);
      const updatedUser = user.withTier(tier2);

      expect(updatedUser.rateLimit.limit).toBe(120); // tier2のデフォルト
      expect(updatedUser.hasCustomRateLimit).toBe(false);
    });
  });
});
