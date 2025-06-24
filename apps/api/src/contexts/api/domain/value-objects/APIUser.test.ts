import { describe, it, expect } from 'vitest';
import { createUserId, createUserTier, TierLevel } from '@nara-opendata/shared-kernel';
import { createAPIUser, getAPIUserId, getAPIUserTier, equalsAPIUser } from './APIUser';

describe('APIUser', () => {
  const userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
  const tier = createUserTier(TierLevel.TIER2);

  describe('createAPIUser', () => {
    it('APIUserを作成する', () => {
      const apiUser = createAPIUser(userId, tier);

      expect(getAPIUserId(apiUser)).toBe(userId);
      expect(getAPIUserTier(apiUser)).toBe(tier);
    });
  });

  describe('equalsAPIUser', () => {
    it('同じユーザーIDとティアのAPIUserは等しい', () => {
      const user1 = createAPIUser(userId, tier);
      const user2 = createAPIUser(userId, tier);

      expect(equalsAPIUser(user1, user2)).toBe(true);
    });

    it('異なるユーザーIDのAPIUserは等しくない', () => {
      const user1 = createAPIUser(userId, tier);
      const user2 = createAPIUser(createUserId('550e8400-e29b-41d4-a716-446655440001'), tier);

      expect(equalsAPIUser(user1, user2)).toBe(false);
    });

    it('異なるティアのAPIUserは等しくない', () => {
      const user1 = createAPIUser(userId, tier);
      const user2 = createAPIUser(userId, createUserTier(TierLevel.TIER3));

      expect(equalsAPIUser(user1, user2)).toBe(false);
    });
  });
});
