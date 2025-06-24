import type { UserId } from '@nara-opendata/shared-kernel';
import type { RateLimitLog } from '../entities/RateLimitLog';

/**
 * レート制限リポジトリのインターフェース
 * レート制限ログの永続化と取得を担当
 */
export interface IRateLimitRepository {
  /**
   * レート制限ログを保存する
   * @param log 保存するログ
   */
  save(log: RateLimitLog): Promise<void>;

  /**
   * 指定された期間内のユーザーのリクエスト数をカウントする
   * @param userId ユーザーID
   * @param windowSeconds 集計期間（秒）
   * @returns リクエスト数
   */
  countByUserIdWithinWindow(userId: UserId, windowSeconds: number): Promise<number>;

  /**
   * ユーザーの最近のレート制限ログを取得する
   * @param userId ユーザーID
   * @param limit 取得件数の上限
   * @returns レート制限ログの配列（新しい順）
   */
  findRecentByUserId(userId: UserId, limit: number): Promise<RateLimitLog[]>;

  /**
   * 古いログを削除する（クリーンアップ用）
   * @param beforeDate この日時より前のログを削除
   * @returns 削除された件数
   */
  deleteOldLogs(beforeDate: Date): Promise<number>;
}
