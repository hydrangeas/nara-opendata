import { describe, it, expect } from 'vitest';
import {
  createTimeRange,
  getTimeRangeStart,
  getTimeRangeEnd,
  equalsTimeRange,
  isValidTimeRange,
  containsDateTime,
  getTimeRangeDurationMillis,
  getTimeRangeDurationSeconds,
  createLastNDaysTimeRange,
  createLastNHoursTimeRange,
} from './TimeRange';

describe('TimeRange', () => {
  describe('createTimeRange', () => {
    it('有効な時間範囲を作成する', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-01-02T00:00:00Z');
      const timeRange = createTimeRange(start, end);

      expect(getTimeRangeStart(timeRange)).toBe(start);
      expect(getTimeRangeEnd(timeRange)).toBe(end);
    });

    it('開始と終了が同じ時刻でも有効', () => {
      const time = new Date('2024-01-01T00:00:00Z');
      const timeRange = createTimeRange(time, time);

      expect(getTimeRangeStart(timeRange)).toBe(time);
      expect(getTimeRangeEnd(timeRange)).toBe(time);
    });

    it('開始が終了より後の場合エラー', () => {
      const start = new Date('2024-01-02T00:00:00Z');
      const end = new Date('2024-01-01T00:00:00Z');

      expect(() => createTimeRange(start, end)).toThrow(
        'TimeRange start must be before or equal to end',
      );
    });

    it('Date以外の値を拒否する', () => {
      expect(() => createTimeRange('2024-01-01' as any, new Date())).toThrow(
        'TimeRange start and end must be Date instances',
      );
      expect(() => createTimeRange(new Date(), '2024-01-01' as any)).toThrow(
        'TimeRange start and end must be Date instances',
      );
    });
  });

  describe('equalsTimeRange', () => {
    it('同じ時間範囲は等しい', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-01-02T00:00:00Z');
      const range1 = createTimeRange(start, end);
      const range2 = createTimeRange(new Date(start), new Date(end));

      expect(equalsTimeRange(range1, range2)).toBe(true);
    });

    it('異なる時間範囲は等しくない', () => {
      const range1 = createTimeRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );
      const range2 = createTimeRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-03T00:00:00Z'),
      );

      expect(equalsTimeRange(range1, range2)).toBe(false);
    });
  });

  describe('isValidTimeRange', () => {
    it('有効な時間範囲を判定する', () => {
      const range = createTimeRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-02T00:00:00Z'),
      );

      expect(isValidTimeRange(range)).toBe(true);
    });
  });

  describe('containsDateTime', () => {
    const range = createTimeRange(
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-02T00:00:00Z'),
    );

    it('範囲内の日時を含む', () => {
      const dateTime = new Date('2024-01-01T12:00:00Z');
      expect(containsDateTime(range, dateTime)).toBe(true);
    });

    it('開始時刻を含む', () => {
      const dateTime = new Date('2024-01-01T00:00:00Z');
      expect(containsDateTime(range, dateTime)).toBe(true);
    });

    it('終了時刻を含む', () => {
      const dateTime = new Date('2024-01-02T00:00:00Z');
      expect(containsDateTime(range, dateTime)).toBe(true);
    });

    it('範囲外の日時を含まない', () => {
      const before = new Date('2023-12-31T23:59:59Z');
      const after = new Date('2024-01-02T00:00:01Z');

      expect(containsDateTime(range, before)).toBe(false);
      expect(containsDateTime(range, after)).toBe(false);
    });
  });

  describe('getTimeRangeDuration', () => {
    it('期間をミリ秒で取得する', () => {
      const range = createTimeRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T01:00:00Z'),
      );

      expect(getTimeRangeDurationMillis(range)).toBe(60 * 60 * 1000); // 1時間
    });

    it('期間を秒で取得する', () => {
      const range = createTimeRange(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T01:00:00Z'),
      );

      expect(getTimeRangeDurationSeconds(range)).toBe(60 * 60); // 1時間
    });

    it('同じ時刻の場合は期間0', () => {
      const time = new Date('2024-01-01T00:00:00Z');
      const range = createTimeRange(time, time);

      expect(getTimeRangeDurationMillis(range)).toBe(0);
      expect(getTimeRangeDurationSeconds(range)).toBe(0);
    });
  });

  describe('createLastNDaysTimeRange', () => {
    it('過去N日間の時間範囲を作成する', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const range = createLastNDaysTimeRange(7, now);

      expect(getTimeRangeEnd(range)).toBe(now);
      expect(getTimeRangeDurationMillis(range)).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('現在時刻を省略できる', () => {
      const range = createLastNDaysTimeRange(1);
      const duration = getTimeRangeDurationMillis(range);

      // 約1日（誤差1秒以内）
      expect(duration).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 1000);
      expect(duration).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 1000);
    });

    it('0以下の日数を拒否する', () => {
      expect(() => createLastNDaysTimeRange(0)).toThrow('Days must be positive');
      expect(() => createLastNDaysTimeRange(-1)).toThrow('Days must be positive');
    });
  });

  describe('createLastNHoursTimeRange', () => {
    it('過去N時間の時間範囲を作成する', () => {
      const now = new Date('2024-01-10T12:00:00Z');
      const range = createLastNHoursTimeRange(3, now);

      expect(getTimeRangeEnd(range)).toBe(now);
      expect(getTimeRangeDurationMillis(range)).toBe(3 * 60 * 60 * 1000);
    });

    it('現在時刻を省略できる', () => {
      const range = createLastNHoursTimeRange(1);
      const duration = getTimeRangeDurationMillis(range);

      // 約1時間（誤差1秒以内）
      expect(duration).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000);
      expect(duration).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    });

    it('0以下の時間を拒否する', () => {
      expect(() => createLastNHoursTimeRange(0)).toThrow('Hours must be positive');
      expect(() => createLastNHoursTimeRange(-1)).toThrow('Hours must be positive');
    });
  });
});
