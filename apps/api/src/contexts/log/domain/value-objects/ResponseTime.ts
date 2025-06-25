/**
 * レスポンスタイム属性
 */
export interface IResponseTimeAttributes {
  milliseconds: number;
}

/**
 * レスポンスタイムバリューオブジェクト
 * APIレスポンスにかかった時間をミリ秒で表現
 */
export type ResponseTime = IResponseTimeAttributes & { readonly brand: unique symbol };

/**
 * レスポンスタイムを作成する
 */
export function createResponseTime(milliseconds: number): ResponseTime {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new Error('Response time must be a non-negative finite number');
  }
  return { milliseconds } as ResponseTime;
}

/**
 * レスポンスタイムのミリ秒値を取得する
 */
export function getResponseTimeMilliseconds(responseTime: ResponseTime): number {
  return responseTime.milliseconds;
}

/**
 * レスポンスタイムを秒に変換する
 */
export function responseTimeToSeconds(responseTime: ResponseTime): number {
  return responseTime.milliseconds / 1000;
}

/**
 * レスポンスタイムの等価性を判定する
 */
export function equalsResponseTime(a: ResponseTime, b: ResponseTime): boolean {
  return a.milliseconds === b.milliseconds;
}

/**
 * レスポンスタイムが遅いかチェックする
 * @param threshold しきい値（ミリ秒）、デフォルトは1000ms（1秒）
 */
export function isSlowResponseTime(responseTime: ResponseTime, threshold = 1000): boolean {
  return responseTime.milliseconds > threshold;
}
