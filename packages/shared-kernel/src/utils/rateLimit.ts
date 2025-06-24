/**
 * レート制限に関するユーティリティ関数
 */

/**
 * 次のリクエストが可能になるまでの秒数を計算する（ウィンドウ開始時刻ベース）
 * @param windowStartTime レート制限ウィンドウの開始時刻
 * @param windowSeconds レート制限ウィンドウの長さ（秒）
 * @param now 現在時刻（省略時は現在時刻を使用）
 * @returns 次のリクエストが可能になるまでの秒数（最小値は0）
 */
export function calculateRetryAfterSeconds(
  windowStartTime: Date,
  windowSeconds: number,
  now: Date = new Date(),
): number {
  const windowEndTime = new Date(windowStartTime.getTime() + windowSeconds * 1000);
  const diff = windowEndTime.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 1000));
}

/**
 * 次のリクエストが可能になるまでの秒数を計算する（リセット時刻ベース）
 * @param resetTime レート制限がリセットされる時刻
 * @param now 現在時刻（省略時は現在時刻を使用）
 * @returns 次のリクエストが可能になるまでの秒数（最小値は0）
 */
export function calculateRetryAfterSecondsFromResetTime(
  resetTime: Date,
  now: Date = new Date(),
): number {
  const diff = resetTime.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 1000));
}

/**
 * レート制限ウィンドウの終了時刻を計算する
 * @param windowStartTime ウィンドウの開始時刻
 * @param windowSeconds ウィンドウの長さ（秒）
 * @returns ウィンドウの終了時刻
 */
export function calculateWindowEndTime(windowStartTime: Date, windowSeconds: number): Date {
  return new Date(windowStartTime.getTime() + windowSeconds * 1000);
}

/**
 * 現在時刻がレート制限ウィンドウ内かどうかを判定する
 * @param windowStartTime ウィンドウの開始時刻
 * @param windowSeconds ウィンドウの長さ（秒）
 * @param now 現在時刻（省略時は現在時刻を使用）
 * @returns ウィンドウ内の場合true
 */
export function isWithinRateLimitWindow(
  windowStartTime: Date,
  windowSeconds: number,
  now: Date = new Date(),
): boolean {
  const windowEndTime = calculateWindowEndTime(windowStartTime, windowSeconds);
  return now < windowEndTime;
}
