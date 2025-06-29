import { injectable, inject } from 'tsyringe';
import type { TierLevel } from '@nara-opendata/shared-kernel';
import {
  getUserTierLevel,
  getTierHierarchy,
  TIER_DEFAULT_RATE_LIMITS,
  calculateRetryAfterSeconds,
} from '@nara-opendata/shared-kernel';
import type { IRateLimitRepository } from '../repositories';
import { RateLimitException } from '../exceptions/RateLimitException';
import { createRateLimitLog, getRateLimitLogRequestedAt } from '../entities/RateLimitLog';
import { createEndpoint, type APIUser, getAPIUserId, getAPIUserTier } from '../value-objects';
import { TYPES } from '../../../../types/di';

/**
 * APIアクセス制御のドメインサービス（クラス版）
 * レート制限とティアアクセス検証を提供
 *
 * @remarks
 * DIコンテナで使用するためにクラスとして実装
 * 元のクラス版と同じインターフェースを提供
 */
@injectable()
export class APIAccessControlServiceClass {
  constructor(
    @inject(TYPES.IRateLimitRepository) private readonly rateLimitRepository: IRateLimitRepository,
  ) {}

  /**
   * ユーザーのレート制限をチェックする
   * @param apiUser APIユーザー
   * @param endpoint アクセスしようとしているエンドポイント
   * @throws {RateLimitException} レート制限を超えている場合
   */
  async checkRateLimit(apiUser: APIUser, endpoint: string): Promise<void> {
    const userId = getAPIUserId(apiUser);
    const userTier = getAPIUserTier(apiUser);
    const userTierLevel = getUserTierLevel(userTier);
    const rateLimit = TIER_DEFAULT_RATE_LIMITS[userTierLevel];

    // 現在のウィンドウ内のリクエスト数を取得
    const currentCount = await this.rateLimitRepository.countByUserIdWithinWindow(
      userId,
      rateLimit.windowSeconds,
    );

    // レート制限チェック
    if (currentCount >= rateLimit.limit) {
      // 最新のログを取得して、次にリクエスト可能になる時間を計算
      const recentLogs = await this.rateLimitRepository.findRecentByUserId(userId, 1);

      let retryAfterSeconds: number = rateLimit.windowSeconds;
      if (recentLogs.length > 0 && recentLogs[0]) {
        retryAfterSeconds = calculateRetryAfterSeconds(
          getRateLimitLogRequestedAt(recentLogs[0]),
          rateLimit.windowSeconds,
        );
      }

      throw new RateLimitException({
        retryAfterSeconds,
        limit: rateLimit.limit,
        windowSeconds: rateLimit.windowSeconds,
      });
    }

    // レート制限内の場合、新しいログを記録
    const log = createRateLimitLog({
      userId,
      endpoint: createEndpoint(endpoint),
    });

    await this.rateLimitRepository.save(log);
  }

  /**
   * ユーザーのレート制限状態を記録する
   * @param apiUser APIユーザー
   * @param endpoint アクセスしたエンドポイント
   */
  async recordRequest(apiUser: APIUser, endpoint: string): Promise<void> {
    const userId = getAPIUserId(apiUser);
    const log = createRateLimitLog({
      userId,
      endpoint: createEndpoint(endpoint),
    });
    await this.rateLimitRepository.save(log);
  }

  /**
   * エンドポイントへのアクセス権限をチェックする
   * @param apiUser APIユーザー
   * @param endpoint チェック対象のエンドポイント
   * @param requiredTier 必要なティアレベル
   * @returns アクセス可能な場合はtrue
   */
  hasAccess(apiUser: APIUser, _endpoint: string, requiredTier: TierLevel): boolean {
    const userTier = getAPIUserTier(apiUser);
    const userLevel = getUserTierLevel(userTier);

    // 共有カーネルの関数を使用してティア階層を比較
    return getTierHierarchy(userLevel) >= getTierHierarchy(requiredTier);
  }

  /**
   * ユーザーの現在のレート制限状態を取得する
   * @param apiUser APIユーザー
   * @returns レート制限の現在の状態
   */
  async getRateLimitStatus(apiUser: APIUser): Promise<{
    currentCount: number;
    limit: number;
    windowSeconds: number;
    remainingRequests: number;
  }> {
    const userId = getAPIUserId(apiUser);
    const userTier = getAPIUserTier(apiUser);
    const userTierLevel = getUserTierLevel(userTier);
    const rateLimit = TIER_DEFAULT_RATE_LIMITS[userTierLevel];

    const currentCount = await this.rateLimitRepository.countByUserIdWithinWindow(
      userId,
      rateLimit.windowSeconds,
    );

    return {
      currentCount,
      limit: rateLimit.limit,
      windowSeconds: rateLimit.windowSeconds,
      remainingRequests: Math.max(0, rateLimit.limit - currentCount),
    };
  }
}
