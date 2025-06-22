import { describe, it, expect } from 'vitest';
import {
  createUserId,
  equalsUserId,
  createUserTier,
  createUserTierFromString,
  getUserTierLevel,
  getUserTierDefaultRateLimit,
  equalsUserTier,
  userTierToString,
  TierLevel,
} from './index';

describe('Shared kernel exports', () => {
  it('should export UserId functions', () => {
    expect(createUserId).toBeDefined();
    expect(equalsUserId).toBeDefined();
  });

  it('should export UserTier functions and TierLevel enum', () => {
    expect(createUserTier).toBeDefined();
    expect(createUserTierFromString).toBeDefined();
    expect(getUserTierLevel).toBeDefined();
    expect(getUserTierDefaultRateLimit).toBeDefined();
    expect(equalsUserTier).toBeDefined();
    expect(userTierToString).toBeDefined();
    expect(TierLevel).toBeDefined();
    expect(TierLevel.TIER1).toBe('TIER1');
  });
});
