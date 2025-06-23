import { describe, it, expect } from 'vitest';
import {
  createUserId,
  equalsUserId,
  createUserTier,
  getUserTierLevel,
  TIER_DEFAULT_RATE_LIMITS,
  equalsUserTier,
  userTierToString,
  TierLevel,
} from './index';

describe('Shared kernel exports', () => {
  it('should export UserId functions', () => {
    expect(createUserId).toBeDefined();
    expect(equalsUserId).toBeDefined();
  });

  it('should export UserTier functions and types', () => {
    expect(createUserTier).toBeDefined();
    expect(getUserTierLevel).toBeDefined();
    expect(TIER_DEFAULT_RATE_LIMITS).toBeDefined();
    expect(equalsUserTier).toBeDefined();
    expect(userTierToString).toBeDefined();
    expect(TierLevel).toBeDefined();
    expect(TierLevel.TIER1).toBe('TIER1');

    // 定数のテスト
    expect(TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1]).toEqual({ limit: 60, windowSeconds: 60 });
  });
});
