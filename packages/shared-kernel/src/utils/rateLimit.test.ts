import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateRetryAfterSeconds,
  calculateRetryAfterSecondsFromResetTime,
  calculateWindowEndTime,
  isWithinRateLimitWindow,
} from './rateLimit';

describe('rateLimit utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateRetryAfterSeconds', () => {
    it('ウィンドウ内の場合、残り秒数を返す', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;

      // 30秒経過後
      vi.setSystemTime(new Date('2024-01-01T00:00:30Z'));
      expect(calculateRetryAfterSeconds(windowStartTime, windowSeconds)).toBe(30);
    });

    it('ウィンドウ終了直前の場合、1秒を返す', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      vi.setSystemTime(now);

      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;

      // 59.5秒経過後（切り上げて1秒）
      vi.setSystemTime(new Date('2024-01-01T00:00:59.500Z'));
      expect(calculateRetryAfterSeconds(windowStartTime, windowSeconds)).toBe(1);
    });

    it('ウィンドウが過ぎている場合、0を返す', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;

      // 61秒経過後
      const now = new Date('2024-01-01T00:01:01Z');
      expect(calculateRetryAfterSeconds(windowStartTime, windowSeconds, now)).toBe(0);
    });

    it('カスタムの現在時刻を使用できる', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;
      const customNow = new Date('2024-01-01T00:00:30Z');

      expect(calculateRetryAfterSeconds(windowStartTime, windowSeconds, customNow)).toBe(30);
    });
  });

  describe('calculateRetryAfterSecondsFromResetTime', () => {
    it('リセット時刻までの残り秒数を返す', () => {
      const now = new Date('2024-01-01T00:00:30Z');
      const resetTime = new Date('2024-01-01T00:01:00Z');

      expect(calculateRetryAfterSecondsFromResetTime(resetTime, now)).toBe(30);
    });

    it('リセット時刻を過ぎている場合、0を返す', () => {
      const now = new Date('2024-01-01T00:01:01Z');
      const resetTime = new Date('2024-01-01T00:01:00Z');

      expect(calculateRetryAfterSecondsFromResetTime(resetTime, now)).toBe(0);
    });

    it('ミリ秒単位の時間も切り上げる', () => {
      const now = new Date('2024-01-01T00:00:59.500Z');
      const resetTime = new Date('2024-01-01T00:01:00Z');

      expect(calculateRetryAfterSecondsFromResetTime(resetTime, now)).toBe(1);
    });

    it('デフォルトで現在時刻を使用する', () => {
      const now = new Date('2024-01-01T00:00:30Z');
      vi.setSystemTime(now);

      const resetTime = new Date('2024-01-01T00:01:00Z');
      expect(calculateRetryAfterSecondsFromResetTime(resetTime)).toBe(30);
    });
  });

  describe('calculateWindowEndTime', () => {
    it('ウィンドウ終了時刻を正しく計算する', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;

      const endTime = calculateWindowEndTime(windowStartTime, windowSeconds);
      expect(endTime).toEqual(new Date('2024-01-01T00:01:00Z'));
    });

    it('大きなウィンドウサイズでも正しく計算する', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 3600; // 1時間

      const endTime = calculateWindowEndTime(windowStartTime, windowSeconds);
      expect(endTime).toEqual(new Date('2024-01-01T01:00:00Z'));
    });
  });

  describe('isWithinRateLimitWindow', () => {
    it('ウィンドウ内の場合trueを返す', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;
      const now = new Date('2024-01-01T00:00:30Z');

      expect(isWithinRateLimitWindow(windowStartTime, windowSeconds, now)).toBe(true);
    });

    it('ウィンドウ終了時刻ちょうどの場合falseを返す', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;
      const now = new Date('2024-01-01T00:01:00Z');

      expect(isWithinRateLimitWindow(windowStartTime, windowSeconds, now)).toBe(false);
    });

    it('ウィンドウを過ぎている場合falseを返す', () => {
      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;
      const now = new Date('2024-01-01T00:01:01Z');

      expect(isWithinRateLimitWindow(windowStartTime, windowSeconds, now)).toBe(false);
    });

    it('デフォルトで現在時刻を使用する', () => {
      const now = new Date('2024-01-01T00:00:30Z');
      vi.setSystemTime(now);

      const windowStartTime = new Date('2024-01-01T00:00:00Z');
      const windowSeconds = 60;

      expect(isWithinRateLimitWindow(windowStartTime, windowSeconds)).toBe(true);
    });
  });
});
