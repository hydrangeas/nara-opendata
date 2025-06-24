import { describe, it, expect } from 'vitest';
import {
  createResponseTime,
  getResponseTimeMilliseconds,
  responseTimeToSeconds,
  equalsResponseTime,
  isSlowResponseTime,
} from './ResponseTime';

describe('ResponseTime', () => {
  describe('createResponseTime', () => {
    it('有効なミリ秒値でレスポンスタイムを作成する', () => {
      const responseTime = createResponseTime(150);
      expect(getResponseTimeMilliseconds(responseTime)).toBe(150);
    });

    it('0ミリ秒を受け入れる', () => {
      const responseTime = createResponseTime(0);
      expect(getResponseTimeMilliseconds(responseTime)).toBe(0);
    });

    it('大きな値を受け入れる', () => {
      const responseTime = createResponseTime(999999);
      expect(getResponseTimeMilliseconds(responseTime)).toBe(999999);
    });

    it('小数値を受け入れる', () => {
      const responseTime = createResponseTime(123.456);
      expect(getResponseTimeMilliseconds(responseTime)).toBe(123.456);
    });

    it('負の値を拒否する', () => {
      expect(() => createResponseTime(-1)).toThrow(
        'Response time must be a non-negative finite number',
      );
      expect(() => createResponseTime(-100)).toThrow(
        'Response time must be a non-negative finite number',
      );
    });

    it('無限大を拒否する', () => {
      expect(() => createResponseTime(Infinity)).toThrow(
        'Response time must be a non-negative finite number',
      );
      expect(() => createResponseTime(-Infinity)).toThrow(
        'Response time must be a non-negative finite number',
      );
    });

    it('NaNを拒否する', () => {
      expect(() => createResponseTime(NaN)).toThrow(
        'Response time must be a non-negative finite number',
      );
    });
  });

  describe('responseTimeToSeconds', () => {
    it('ミリ秒を秒に変換する', () => {
      const responseTime = createResponseTime(1500);
      expect(responseTimeToSeconds(responseTime)).toBe(1.5);
    });

    it('1秒未満の値を正しく変換する', () => {
      const responseTime = createResponseTime(250);
      expect(responseTimeToSeconds(responseTime)).toBe(0.25);
    });

    it('0ミリ秒は0秒になる', () => {
      const responseTime = createResponseTime(0);
      expect(responseTimeToSeconds(responseTime)).toBe(0);
    });
  });

  describe('equalsResponseTime', () => {
    it('同じミリ秒値は等しい', () => {
      const time1 = createResponseTime(100);
      const time2 = createResponseTime(100);
      expect(equalsResponseTime(time1, time2)).toBe(true);
    });

    it('異なるミリ秒値は等しくない', () => {
      const time1 = createResponseTime(100);
      const time2 = createResponseTime(200);
      expect(equalsResponseTime(time1, time2)).toBe(false);
    });

    it('小数値の等価性を正しく判定する', () => {
      const time1 = createResponseTime(100.5);
      const time2 = createResponseTime(100.5);
      expect(equalsResponseTime(time1, time2)).toBe(true);
    });
  });

  describe('isSlowResponseTime', () => {
    it('デフォルトしきい値（1秒）より遅い場合trueを返す', () => {
      const slowTime = createResponseTime(1500);
      expect(isSlowResponseTime(slowTime)).toBe(true);
    });

    it('デフォルトしきい値（1秒）以下の場合falseを返す', () => {
      const fastTime = createResponseTime(800);
      expect(isSlowResponseTime(fastTime)).toBe(false);
    });

    it('しきい値ちょうどの場合falseを返す', () => {
      const exactTime = createResponseTime(1000);
      expect(isSlowResponseTime(exactTime)).toBe(false);
    });

    it('カスタムしきい値を使用できる', () => {
      const responseTime = createResponseTime(300);
      expect(isSlowResponseTime(responseTime, 200)).toBe(true);
      expect(isSlowResponseTime(responseTime, 500)).toBe(false);
    });

    it('0ミリ秒は遅くない', () => {
      const zeroTime = createResponseTime(0);
      expect(isSlowResponseTime(zeroTime)).toBe(false);
    });
  });

  describe('パフォーマンス分析のユースケース', () => {
    it('レスポンスタイムの統計を計算できる', () => {
      const times = [100, 200, 150, 300, 250].map(createResponseTime);

      // 平均値を計算
      const average =
        times.reduce((sum, time) => sum + getResponseTimeMilliseconds(time), 0) / times.length;
      expect(average).toBe(200);

      // 遅いリクエストを検出
      const slowRequests = times.filter((time) => isSlowResponseTime(time, 200));
      expect(slowRequests).toHaveLength(2); // 250ms と 300ms
    });
  });
});
