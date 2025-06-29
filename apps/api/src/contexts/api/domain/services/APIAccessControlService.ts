import type { TierLevel } from '@nara-opendata/shared-kernel';
import type { APIUser } from '../value-objects';
import type { APIAccessControlServiceClass } from './APIAccessControlService.class';

/**
 * APIアクセス制御のドメインサービス
 * レート制限とティアアクセス検証を提供
 *
 * @deprecated 新規コードではAPIAccessControlServiceClassを使用してください。
 * このクラスは後方互換性のために保持されています。
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class APIAccessControlService {
  private static instance: APIAccessControlServiceClass | null = null;

  /**
   * インスタンスを設定する（テスト用）
   */
  static setInstance(instance: APIAccessControlServiceClass): void {
    this.instance = instance;
  }

  /**
   * ユーザーのレート制限をチェックする
   * @param apiUser APIユーザー
   * @param endpoint アクセスしようとしているエンドポイント
   * @throws {RateLimitException} レート制限を超えている場合
   */
  static async checkRateLimit(apiUser: APIUser, endpoint: string): Promise<void> {
    if (!this.instance) {
      throw new Error('APIAccessControlService instance not initialized');
    }
    return this.instance.checkRateLimit(apiUser, endpoint);
  }

  /**
   * ユーザーのレート制限状態を記録する
   * @param apiUser APIユーザー
   * @param endpoint アクセスしたエンドポイント
   */
  static async recordRequest(apiUser: APIUser, endpoint: string): Promise<void> {
    if (!this.instance) {
      throw new Error('APIAccessControlService instance not initialized');
    }
    return this.instance.recordRequest(apiUser, endpoint);
  }

  /**
   * エンドポイントへのアクセス権限をチェックする
   * @param apiUser APIユーザー
   * @param endpoint チェック対象のエンドポイント
   * @param requiredTier 必要なティアレベル
   * @returns アクセス可能な場合はtrue
   */
  static hasAccess(apiUser: APIUser, endpoint: string, requiredTier: TierLevel): boolean {
    if (!this.instance) {
      throw new Error('APIAccessControlService instance not initialized');
    }
    return this.instance.hasAccess(apiUser, endpoint, requiredTier);
  }

  /**
   * ユーザーの現在のレート制限状態を取得する
   * @param apiUser APIユーザー
   * @returns レート制限の現在の状態
   */
  static async getRateLimitStatus(apiUser: APIUser): Promise<{
    currentCount: number;
    limit: number;
    windowSeconds: number;
    remainingRequests: number;
  }> {
    if (!this.instance) {
      throw new Error('APIAccessControlService instance not initialized');
    }
    return this.instance.getRateLimitStatus(apiUser);
  }
}

// Re-export the class-based version for DI
export { APIAccessControlServiceClass } from './APIAccessControlService.class';
