/**
 * 時間範囲属性
 */
export interface ITimeRangeAttributes {
  start: Date;
  end: Date;
}

/**
 * 時間範囲バリューオブジェクト
 * ログ検索などで使用する時間範囲を表現
 */
export type TimeRange = ITimeRangeAttributes & { readonly brand: unique symbol };

/**
 * 時間範囲を作成する
 */
export function createTimeRange(start: Date, end: Date): TimeRange {
  if (!(start instanceof Date) || !(end instanceof Date)) {
    throw new Error('TimeRange start and end must be Date instances');
  }

  const timeRange = { start, end } as TimeRange;

  if (!isValidTimeRange(timeRange)) {
    throw new Error('TimeRange start must be before or equal to end');
  }

  return timeRange;
}

/**
 * 開始時刻を取得する
 */
export function getTimeRangeStart(timeRange: TimeRange): Date {
  return timeRange.start;
}

/**
 * 終了時刻を取得する
 */
export function getTimeRangeEnd(timeRange: TimeRange): Date {
  return timeRange.end;
}

/**
 * 時間範囲の等価性を判定する
 */
export function equalsTimeRange(a: TimeRange, b: TimeRange): boolean {
  return a.start.getTime() === b.start.getTime() && a.end.getTime() === b.end.getTime();
}

/**
 * 時間範囲が有効かチェックする
 */
export function isValidTimeRange(timeRange: TimeRange): boolean {
  return timeRange.start.getTime() <= timeRange.end.getTime();
}

/**
 * 指定した日時が時間範囲内に含まれるかチェックする
 */
export function containsDateTime(timeRange: TimeRange, dateTime: Date): boolean {
  const time = dateTime.getTime();
  return timeRange.start.getTime() <= time && time <= timeRange.end.getTime();
}

/**
 * 時間範囲の期間をミリ秒で取得する
 */
export function getTimeRangeDurationMillis(timeRange: TimeRange): number {
  return timeRange.end.getTime() - timeRange.start.getTime();
}

/**
 * 時間範囲の期間を秒で取得する
 */
export function getTimeRangeDurationSeconds(timeRange: TimeRange): number {
  return getTimeRangeDurationMillis(timeRange) / 1000;
}

/**
 * 過去N日間の時間範囲を作成する
 */
export function createLastNDaysTimeRange(days: number, now = new Date()): TimeRange {
  if (days <= 0) {
    throw new Error('Days must be positive');
  }
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return createTimeRange(start, now);
}

/**
 * 過去N時間の時間範囲を作成する
 */
export function createLastNHoursTimeRange(hours: number, now = new Date()): TimeRange {
  if (hours <= 0) {
    throw new Error('Hours must be positive');
  }
  const start = new Date(now.getTime() - hours * 60 * 60 * 1000);
  return createTimeRange(start, now);
}
