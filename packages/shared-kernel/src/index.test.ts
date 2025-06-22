import { describe, it, expect } from 'vitest';
import {
  createUserId,
  equalsUserId,
  createUserTier,
  getUserTierLevel,
  getUserTierDefaultRateLimit,
  equalsUserTier,
  userTierToString,
  TierLevel,
  type IRateLimitConfig,
} from './index';

describe('Shared kernel exports', () => {
  it('should export UserId functions', () => {
    expect(createUserId).toBeDefined();
    expect(equalsUserId).toBeDefined();
  });

  it('should export UserTier functions and types', () => {
    expect(createUserTier).toBeDefined();
    expect(getUserTierLevel).toBeDefined();
    expect(getUserTierDefaultRateLimit).toBeDefined();
    expect(equalsUserTier).toBeDefined();
    expect(userTierToString).toBeDefined();
    expect(TierLevel).toBeDefined();
    expect(TierLevel.TIER1).toBe('TIER1');

    // 型のテスト（型が正しくエクスポートされていることを確認）
    const config: IRateLimitConfig = { limit: 60, windowSeconds: 60 };
    expect(config).toBeDefined();
  });
});
