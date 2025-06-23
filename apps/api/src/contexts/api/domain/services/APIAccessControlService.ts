import type { UserId, UserTier } from '@nara-opendata/shared-kernel';
import {
  getUserTierLevel,
  TIER_DEFAULT_RATE_LIMITS,
  TierLevel,
} from '@nara-opendata/shared-kernel';
import type { IRateLimitRepository } from '../repositories';
import { RateLimitException } from '../exceptions/RateLimitException';
import { RateLimitLog } from '../entities/RateLimitLog';
import { createEndpoint } from '../value-objects';

/**
 * APIアクセス制御のドメインサービス
 * レート制限とティアアクセス検証を提供
 */
export class APIAccessControlService {
  constructor(private readonly rateLimitRepository: IRateLimitRepository) {}

  /**
   * ユーザーのレート制限をチェックする
   * @param userId ユーザーID
   * @param userTier ユーザーティア
   * @param endpoint アクセスしようとしているエンドポイント
   * @throws {RateLimitException} レート制限を超えている場合
   */
  async checkRateLimit(userId: UserId, userTier: UserTier, endpoint: string): Promise<void> {
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
        const oldestLogTime = recentLogs[0].requestedAt.getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - oldestLogTime) / 1000);
        retryAfterSeconds = Math.max(1, rateLimit.windowSeconds - elapsedSeconds);
      }

      throw new RateLimitException({
        retryAfterSeconds,
        limit: rateLimit.limit,
        windowSeconds: rateLimit.windowSeconds,
      });
    }

    // レート制限内の場合、新しいログを記録
    const log = RateLimitLog.create({
      userId,
      endpoint: createEndpoint(endpoint),
    });

    await this.rateLimitRepository.save(log);
  }

  /**
   * ユーザーティアが要求されるティア以上かを検証する
   * @param userTier ユーザーのティア
   * @param requiredTier 必要なティアレベル
   * @returns アクセス可能な場合true
   */
  validateTierAccess(userTier: UserTier, requiredTier: TierLevel): boolean {
    const userLevel = getUserTierLevel(userTier);

    // ティアレベルの序列を定義（高い方が権限が強い）
    const tierOrder: Record<TierLevel, number> = {
      [TierLevel.TIER1]: 1,
      [TierLevel.TIER2]: 2,
      [TierLevel.TIER3]: 3,
    };

    return tierOrder[userLevel] >= tierOrder[requiredTier];
  }
}
