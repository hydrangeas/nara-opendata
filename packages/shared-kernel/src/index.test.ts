import { describe, it, expect } from 'vitest';
import { createUserId, equalsUserId, UserTier, TierLevel } from './index';

describe('Shared kernel exports', () => {
  it('should export UserId functions', () => {
    expect(createUserId).toBeDefined();
    expect(equalsUserId).toBeDefined();
  });

  it('should export UserTier class and TierLevel enum', () => {
    expect(UserTier).toBeDefined();
    expect(TierLevel).toBeDefined();
    expect(TierLevel.TIER1).toBe('TIER1');
  });
});
