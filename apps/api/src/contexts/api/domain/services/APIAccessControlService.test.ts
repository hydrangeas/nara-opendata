import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createUserId,
  createUserTier,
  TierLevel,
  TIER_DEFAULT_RATE_LIMITS,
} from '@nara-opendata/shared-kernel';
import type { UserId } from '@nara-opendata/shared-kernel';
import type { IRateLimitRepository } from '../repositories';
import { reconstructRateLimitLog } from '../entities/RateLimitLog';
import { createAPIUser, type APIUser } from '../value-objects';
import { APIAccessControlServiceClass } from './APIAccessControlService.class';
import { RateLimitException } from '../exceptions/RateLimitException';

describe('APIAccessControlService', () => {
  let service: APIAccessControlServiceClass;
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
    service = new APIAccessControlServiceClass(mockRepository);
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
    });

    it('レート制限を超えた場合、RateLimitExceptionをスローする', async () => {
      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(
        TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].limit,
      );

      const recentLog = reconstructRateLimitLog({
        id: 'log-1',
        userId: userId as string,
        endpoint,
        requestedAt: new Date(),
      });
      vi.mocked(mockRepository.findRecentByUserId).mockResolvedValue([recentLog]);

      await expect(service.checkRateLimit(apiUser, endpoint)).rejects.toThrow(RateLimitException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('最近のログから適切なretryAfterSecondsを計算する', async () => {
      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(
        TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER1].limit,
      );

      const requestedAt = new Date();
      requestedAt.setSeconds(requestedAt.getSeconds() - 30); // 30秒前

      const recentLog = reconstructRateLimitLog({
        id: 'log-1',
        userId: userId as string,
        endpoint,
        requestedAt,
      });
      vi.mocked(mockRepository.findRecentByUserId).mockResolvedValue([recentLog]);

      try {
        await service.checkRateLimit(apiUser, endpoint);
        expect.fail('Should throw RateLimitException');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitException);
        const rateLimitError = error as RateLimitException;
        // 60秒のウィンドウ - 30秒経過 = 30秒後にリトライ可能
        expect(rateLimitError.retryAfterSeconds).toBeGreaterThanOrEqual(29);
        expect(rateLimitError.retryAfterSeconds).toBeLessThanOrEqual(31);
      }
    });

    it('各ティアに応じた異なるレート制限を適用する', async () => {
      const tier2ApiUser = createAPIUser(userId, createUserTier(TierLevel.TIER2));

      vi.mocked(mockRepository.countByUserIdWithinWindow).mockResolvedValue(61);

      // TIER2は120リクエストまで許可されるのでエラーにならない
      await expect(service.checkRateLimit(tier2ApiUser, endpoint)).resolves.not.toThrow();

      expect(mockRepository.countByUserIdWithinWindow).toHaveBeenCalledWith(
        userId,
        TIER_DEFAULT_RATE_LIMITS[TierLevel.TIER2].windowSeconds,
      );
    });
  });

  describe('hasAccess', () => {
    it('同じティアレベルでアクセス可能', () => {
      const tier2User = createAPIUser(userId, createUserTier(TierLevel.TIER2));
      expect(service.hasAccess(tier2User, '/api/v1/data', TierLevel.TIER2)).toBe(true);
    });

    it('より高いティアレベルでアクセス可能', () => {
      const tier3User = createAPIUser(userId, createUserTier(TierLevel.TIER3));
      expect(service.hasAccess(tier3User, '/api/v1/data', TierLevel.TIER1)).toBe(true);
      expect(service.hasAccess(tier3User, '/api/v1/data', TierLevel.TIER2)).toBe(true);
    });

    it('より低いティアレベルではアクセス不可', () => {
      const tier1User = createAPIUser(userId, createUserTier(TierLevel.TIER1));
      expect(service.hasAccess(tier1User, '/api/v1/data', TierLevel.TIER2)).toBe(false);
      expect(service.hasAccess(tier1User, '/api/v1/data', TierLevel.TIER3)).toBe(false);
    });

    it('すべてのティアレベルの組み合わせが正しく動作する', () => {
      const tier1User = createAPIUser(userId, createUserTier(TierLevel.TIER1));
      const tier2User = createAPIUser(userId, createUserTier(TierLevel.TIER2));
      const tier3User = createAPIUser(userId, createUserTier(TierLevel.TIER3));

      // TIER1ユーザー
      expect(service.hasAccess(tier1User, '/api/v1/data', TierLevel.TIER1)).toBe(true);
      expect(service.hasAccess(tier1User, '/api/v1/data', TierLevel.TIER2)).toBe(false);
      expect(service.hasAccess(tier1User, '/api/v1/data', TierLevel.TIER3)).toBe(false);

      // TIER2ユーザー
      expect(service.hasAccess(tier2User, '/api/v1/data', TierLevel.TIER1)).toBe(true);
      expect(service.hasAccess(tier2User, '/api/v1/data', TierLevel.TIER2)).toBe(true);
      expect(service.hasAccess(tier2User, '/api/v1/data', TierLevel.TIER3)).toBe(false);

      // TIER3ユーザー
      expect(service.hasAccess(tier3User, '/api/v1/data', TierLevel.TIER1)).toBe(true);
      expect(service.hasAccess(tier3User, '/api/v1/data', TierLevel.TIER2)).toBe(true);
      expect(service.hasAccess(tier3User, '/api/v1/data', TierLevel.TIER3)).toBe(true);
    });
  });
});
