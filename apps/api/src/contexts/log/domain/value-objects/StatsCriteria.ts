import type { TimeRange } from './TimeRange';

/**
 * 統計条件属性
 */
export interface IStatsCriteriaAttributes {
  timeRange: TimeRange;
  groupBy?: string;
  filters?: Record<string, unknown>;
  metrics?: string[];
}

/**
 * 統計条件バリューオブジェクト
 * ログ分析の統計を取得する際の条件を表現
 */
export type StatsCriteria = IStatsCriteriaAttributes & { readonly brand: unique symbol };

/**
 * 統計条件を作成する
 */
export function createStatsCriteria(params: {
  timeRange: TimeRange;
  groupBy?: string;
  filters?: Record<string, unknown>;
  metrics?: string[];
}): StatsCriteria {
  if (!params.timeRange) {
    throw new Error('TimeRange is required for StatsCriteria');
  }

  return {
    timeRange: params.timeRange,
    groupBy: params.groupBy,
    filters: params.filters || {},
    metrics: params.metrics || [],
  } as StatsCriteria;
}

/**
 * 時間範囲を取得する
 */
export function getStatsCriteriaTimeRange(statsCriteria: StatsCriteria): TimeRange {
  return statsCriteria.timeRange;
}

/**
 * グループ化フィールドを取得する
 */
export function getStatsCriteriaGroupBy(statsCriteria: StatsCriteria): string | undefined {
  return statsCriteria.groupBy;
}

/**
 * フィルター条件を取得する
 */
export function getStatsCriteriaFilters(statsCriteria: StatsCriteria): Record<string, unknown> {
  return statsCriteria.filters || {};
}

/**
 * メトリクス（集計項目）を取得する
 */
export function getStatsCriteriaMetrics(statsCriteria: StatsCriteria): string[] {
  return statsCriteria.metrics || [];
}

/**
 * 統計条件の等価性を判定する
 */
export function equalsStatsCriteria(a: StatsCriteria, b: StatsCriteria): boolean {
  // TimeRangeの比較
  if (
    a.timeRange.start.getTime() !== b.timeRange.start.getTime() ||
    a.timeRange.end.getTime() !== b.timeRange.end.getTime()
  ) {
    return false;
  }

  // groupByの比較
  if (a.groupBy !== b.groupBy) {
    return false;
  }

  // filtersの比較（簡易版）
  const aFilters = JSON.stringify(a.filters || {});
  const bFilters = JSON.stringify(b.filters || {});
  if (aFilters !== bFilters) {
    return false;
  }

  // metricsの比較
  const aMetrics = (a.metrics || []).sort().join(',');
  const bMetrics = (b.metrics || []).sort().join(',');
  return aMetrics === bMetrics;
}

/**
 * フィルターを追加した新しい統計条件を作成する
 */
export function addFilter(
  statsCriteria: StatsCriteria,
  key: string,
  value: unknown,
): StatsCriteria {
  return createStatsCriteria({
    timeRange: statsCriteria.timeRange,
    ...(statsCriteria.groupBy !== undefined && { groupBy: statsCriteria.groupBy }),
    filters: {
      ...statsCriteria.filters,
      [key]: value,
    },
    ...(statsCriteria.metrics !== undefined && { metrics: statsCriteria.metrics }),
  });
}

/**
 * メトリクスを追加した新しい統計条件を作成する
 */
export function addMetric(statsCriteria: StatsCriteria, metric: string): StatsCriteria {
  const currentMetrics = statsCriteria.metrics || [];
  if (currentMetrics.includes(metric)) {
    return statsCriteria;
  }

  return createStatsCriteria({
    timeRange: statsCriteria.timeRange,
    ...(statsCriteria.groupBy !== undefined && { groupBy: statsCriteria.groupBy }),
    ...(statsCriteria.filters !== undefined && { filters: statsCriteria.filters }),
    metrics: [...currentMetrics, metric],
  });
}
