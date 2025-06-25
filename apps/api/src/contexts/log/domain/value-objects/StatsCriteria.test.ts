import { describe, it, expect } from 'vitest';
import {
  createStatsCriteria,
  getStatsCriteriaTimeRange,
  getStatsCriteriaGroupBy,
  getStatsCriteriaFilters,
  getStatsCriteriaMetrics,
  equalsStatsCriteria,
  addFilter,
  addMetric,
} from './StatsCriteria';
import { createTimeRange } from './TimeRange';

describe('StatsCriteria', () => {
  const defaultTimeRange = createTimeRange(new Date('2024-01-01'), new Date('2024-01-02'));

  describe('createStatsCriteria', () => {
    it('必須のtimeRangeで統計条件を作成する', () => {
      const criteria = createStatsCriteria({ timeRange: defaultTimeRange });

      expect(getStatsCriteriaTimeRange(criteria)).toBe(defaultTimeRange);
      expect(getStatsCriteriaGroupBy(criteria)).toBeUndefined();
      expect(getStatsCriteriaFilters(criteria)).toEqual({});
      expect(getStatsCriteriaMetrics(criteria)).toEqual([]);
    });

    it('すべてのオプションを指定して作成する', () => {
      const criteria = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'userId',
        filters: { status: 'error', region: 'asia' },
        metrics: ['count', 'avg', 'max'],
      });

      expect(getStatsCriteriaGroupBy(criteria)).toBe('userId');
      expect(getStatsCriteriaFilters(criteria)).toEqual({
        status: 'error',
        region: 'asia',
      });
      expect(getStatsCriteriaMetrics(criteria)).toEqual(['count', 'avg', 'max']);
    });

    it('timeRangeなしで作成しようとするとエラー', () => {
      expect(() => createStatsCriteria({ timeRange: null as any })).toThrow(
        'TimeRange is required for StatsCriteria',
      );
    });

    it('部分的なオプションで作成する', () => {
      const criteria = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'path',
      });

      expect(getStatsCriteriaGroupBy(criteria)).toBe('path');
      expect(getStatsCriteriaFilters(criteria)).toEqual({});
      expect(getStatsCriteriaMetrics(criteria)).toEqual([]);
    });
  });

  describe('equalsStatsCriteria', () => {
    it('同じ値の統計条件は等しい', () => {
      const criteria1 = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'userId',
        filters: { status: 'error' },
        metrics: ['count', 'avg'],
      });

      const criteria2 = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'userId',
        filters: { status: 'error' },
        metrics: ['count', 'avg'],
      });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(true);
    });

    it('異なるtimeRangeは等しくない', () => {
      const otherTimeRange = createTimeRange(new Date('2024-02-01'), new Date('2024-02-02'));

      const criteria1 = createStatsCriteria({ timeRange: defaultTimeRange });
      const criteria2 = createStatsCriteria({ timeRange: otherTimeRange });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(false);
    });

    it('異なるgroupByは等しくない', () => {
      const criteria1 = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'userId',
      });
      const criteria2 = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'path',
      });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(false);
    });

    it('異なるfiltersは等しくない', () => {
      const criteria1 = createStatsCriteria({
        timeRange: defaultTimeRange,
        filters: { status: 'error' },
      });
      const criteria2 = createStatsCriteria({
        timeRange: defaultTimeRange,
        filters: { status: 'success' },
      });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(false);
    });

    it('metricsの順序が異なっても等しい', () => {
      const criteria1 = createStatsCriteria({
        timeRange: defaultTimeRange,
        metrics: ['count', 'avg', 'max'],
      });
      const criteria2 = createStatsCriteria({
        timeRange: defaultTimeRange,
        metrics: ['max', 'count', 'avg'],
      });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(true);
    });

    it('空の配列とundefinedは異なる', () => {
      const criteria1 = createStatsCriteria({
        timeRange: defaultTimeRange,
        metrics: [],
      });
      const criteria2 = createStatsCriteria({
        timeRange: defaultTimeRange,
      });

      expect(equalsStatsCriteria(criteria1, criteria2)).toBe(true); // 両方とも[]として扱われる
    });
  });

  describe('addFilter', () => {
    it('新しいフィルターを追加する', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        filters: { status: 'error' },
      });

      const updated = addFilter(original, 'userId', 'user-123');

      expect(getStatsCriteriaFilters(updated)).toEqual({
        status: 'error',
        userId: 'user-123',
      });
      // 元のオブジェクトは変更されない
      expect(getStatsCriteriaFilters(original)).toEqual({ status: 'error' });
    });

    it('既存のフィルターを上書きする', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        filters: { status: 'error' },
      });

      const updated = addFilter(original, 'status', 'success');

      expect(getStatsCriteriaFilters(updated)).toEqual({ status: 'success' });
    });

    it('他のプロパティを保持する', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'userId',
        metrics: ['count'],
      });

      const updated = addFilter(original, 'status', 'error');

      expect(getStatsCriteriaGroupBy(updated)).toBe('userId');
      expect(getStatsCriteriaMetrics(updated)).toEqual(['count']);
    });
  });

  describe('addMetric', () => {
    it('新しいメトリクスを追加する', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        metrics: ['count'],
      });

      const updated = addMetric(original, 'avg');

      expect(getStatsCriteriaMetrics(updated)).toEqual(['count', 'avg']);
      // 元のオブジェクトは変更されない
      expect(getStatsCriteriaMetrics(original)).toEqual(['count']);
    });

    it('重複するメトリクスは追加しない', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        metrics: ['count', 'avg'],
      });

      const updated = addMetric(original, 'count');

      expect(updated).toBe(original); // 同じオブジェクトを返す
      expect(getStatsCriteriaMetrics(updated)).toEqual(['count', 'avg']);
    });

    it('初回メトリクスを追加する', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
      });

      const updated = addMetric(original, 'count');

      expect(getStatsCriteriaMetrics(updated)).toEqual(['count']);
    });

    it('他のプロパティを保持する', () => {
      const original = createStatsCriteria({
        timeRange: defaultTimeRange,
        groupBy: 'path',
        filters: { status: 'error' },
      });

      const updated = addMetric(original, 'p95');

      expect(getStatsCriteriaGroupBy(updated)).toBe('path');
      expect(getStatsCriteriaFilters(updated)).toEqual({ status: 'error' });
    });
  });

  describe('ユースケース', () => {
    it('ログ分析クエリの条件を構築する', () => {
      // 基本条件を作成
      let criteria = createStatsCriteria({
        timeRange: createTimeRange(new Date('2024-01-01'), new Date('2024-01-31')),
      });

      // ユーザーIDでグループ化
      criteria = createStatsCriteria({
        ...criteria,
        groupBy: 'userId',
      });

      // エラーのみフィルタリング
      criteria = addFilter(criteria, 'statusCode', { gte: 400 });

      // 必要なメトリクスを追加
      criteria = addMetric(criteria, 'count');
      criteria = addMetric(criteria, 'errorRate');

      // 最終的な条件を確認
      expect(getStatsCriteriaGroupBy(criteria)).toBe('userId');
      expect(getStatsCriteriaFilters(criteria)).toEqual({
        statusCode: { gte: 400 },
      });
      expect(getStatsCriteriaMetrics(criteria)).toEqual(['count', 'errorRate']);
    });

    it('複雑なフィルター条件を構築する', () => {
      const criteria = createStatsCriteria({
        timeRange: defaultTimeRange,
        filters: {
          statusCode: { gte: 400, lt: 500 },
          path: { startsWith: '/api/' },
          userId: { in: ['user1', 'user2', 'user3'] },
        },
        metrics: ['count', 'avg', 'p95', 'p99'],
      });

      const filters = getStatsCriteriaFilters(criteria);
      expect(filters['statusCode']).toEqual({ gte: 400, lt: 500 });
      expect(filters['path']).toEqual({ startsWith: '/api/' });
      expect(filters['userId']).toEqual({ in: ['user1', 'user2', 'user3'] });
    });
  });
});
