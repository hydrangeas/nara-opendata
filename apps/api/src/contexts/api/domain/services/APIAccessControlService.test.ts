import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUserId,
  createUserTier,
  TierLevel,
  TIER_DEFAULT_RATE_LIMITS,
} from '@nara-opendata/shared-kernel';
import type { UserId } from '@nara-opendata/shared-kernel';
import type { IRateLimitRepository } from '../repositories';
import { RateLimitLog } from '../entities/RateLimitLog';
import { createEndpoint, createAPIUser, type APIUser } from '../value-objects';
import { APIAccessControlService } from './APIAccessControlService';
import { RateLimitException } from '../exceptions/RateLimitException';

describe('APIAccessControlService', () => {
  let service: APIAccessControlService;
  let mockRepository: IRateLimitRepository;
  let userId: UserId;
  let apiUser: APIUser;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn(),
      countByUserIdWithinWindow: vi.fn(),
      findRecentByUserId: vi.fn(),
      deleteOldLogs: vi.fn(),
    };
    service = new APIAccessControlService(mockRepository);
    userId = createUserId('550e8400-e29b-41d4-a716-446655440000');
    apiUser = createAPIUser(userId, createUserTier(TierLevel.TIER1));
  });

  describe('checkRateLimit', () => {
    const endpoint = '/api/v1/data';

    it('レート制限内の場合、ログを保存する', async () => {
      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(10);

      await service.checkRateLimit(apiUser, endpoint);

      expect(mockRepository.countByUserIdWithinWindow).toHaveBeenCalledWith(
        userId,
        TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].windowSeconds,
      );
      expect(mockRepository.save).toHaveBeenCalled();

      const savedLog = vi.mocked(mockRepository.save).mock.calls[0]?.[0];
      expect(savedLog).toBeInstanceOf(RateLimitLog);
      expect(savedLog?.userId).toBe(userId);
    });

    it('レート制限を超えた場合、RateLimitExceptionをスローする', async () => {
      const rateLimit = TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1];
      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(rateLimit.limit);
      vi.mocked(mockRepository.findRecentByUserId).mockResolvedValue([]);

      await expect(service.checkRateLimit(apiUser, endpoint)).rejects.toThrow(RateLimitException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('最近のログから適切なretryAfterSecondsを計算する', async () => {
      const rateLimit = TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1];
      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(rateLimit.limit);

      // 30秒前のログ
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      const recentLog = RateLimitLog.reconstruct({
        id: { value: 'log123' } as any,
        userId: userId,
        endpoint: createEndpoint(endpoint),
        requestedAt: thirtySecondsAgo,
      });
      vi.mocked(mockRepository.findRecentByUserId).mockResolvedValue([recentLog]);

      try {
        await service.checkRateLimit(apiUser, endpoint);
        expect.fail('Should throw RateLimitException');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitException);
        const rateLimitError = error as RateLimitException;
        // 60秒のウィンドウ - 30秒経過 = 30秒後にリトライ可能
        expect(rateLimitError.retryAfterSeconds).toBe(30);
      }
    });

    it('各ティアに応じた異なるレート制限を適用する', async () => {
      // TIER2ユーザー
      const tier2UserId = createUserId('123e4567-e89b-12d3-a456-426614174000');
      const tier2ApiUser = createAPIUser(tier2UserId, createUserTier(TierLevel.TIER2));

      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(100);

      // TIER2は120リクエストまで許可されるのでエラーにならない
      await expect(service.checkRateLimit(tier2ApiUser, endpoint)).resolves.not.toThrow();

      expect(mockRepository.countByUserIdWithinWindow).toHaveBeenCalledWith(
        tier2UserId,
        TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER2].windowSeconds,
      );
    });
  });

  describe('validateTierAccess', () => {
    it('同じティアレベルでアクセス可能', () => {
      const tier2User = createAPIUser(userId, createUserTier(TierLevel.TIER2));
      expect(service.validateTierAccess(tier2User, TierLevel.TIER2)).toBe(true);
    });

    it('より高いティアレベルでアクセス可能', () => {
      const tier3User = createAPIUser(userId, createUserTier(TierLevel.TIER3));
      expect(service.validateTierAccess(tier3User, TierLevel.TIER1)).toBe(true);
      expect(service.validateTierAccess(tier3User, TierLevel.TIER2)).toBe(true);
    });

    it('より低いティアレベルではアクセス不可', () => {
      const tier1User = createAPIUser(userId, createUserTier(TierLevel.TIER1));
      expect(service.validateTierAccess(tier1User, TierLevel.TIER2)).toBe(false);
      expect(service.validateTierAccess(tier1User, TierLevel.TIER3)).toBe(false);
    });

    it('すべてのティアレベルの組み合わせが正しく動作する', () => {
      const tier1User = createAPIUser(userId, createUserTier(TierLevel.TIER1));
      const tier2User = createAPIUser(userId, createUserTier(TierLevel.TIER2));
      const tier3User = createAPIUser(userId, createUserTier(TierLevel.TIER3));

      // TIER1ユーザー
      expect(service.validateTierAccess(tier1User, TierLevel.TIER1)).toBe(true);
      expect(service.validateTierAccess(tier1User, TierLevel.TIER2)).toBe(false);
      expect(service.validateTierAccess(tier1User, TierLevel.TIER3)).toBe(false);

      // TIER2ユーザー
      expect(service.validateTierAccess(tier2User, TierLevel.TIER1)).toBe(true);
      expect(service.validateTierAccess(tier2User, TierLevel.TIER2)).toBe(true);
      expect(service.validateTierAccess(tier2User, TierLevel.TIER3)).toBe(false);

      // TIER3ユーザー
      expect(service.validateTierAccess(tier3User, TierLevel.TIER1)).toBe(true);
      expect(service.validateTierAccess(tier3User, TierLevel.TIER2)).toBe(true);
      expect(service.validateTierAccess(tier3User, TierLevel.TIER3)).toBe(true);
    });
  });
});
