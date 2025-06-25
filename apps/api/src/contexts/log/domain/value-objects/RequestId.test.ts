import { describe, it, expect } from 'vitest';
import {
  generateRequestId,
  createRequestId,
  getRequestIdValue,
  equalsRequestId,
} from './RequestId';

describe('RequestId', () => {
  describe('generateRequestId', () => {
    it('新しいリクエストIDを生成する', () => {
      const requestId = generateRequestId();
      const value = getRequestIdValue(requestId);

      // UUID形式であることを確認
      expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      // 小文字であることを確認
      expect(value).toBe(value.toLowerCase());
    });

    it('毎回異なるIDを生成する', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(getRequestIdValue(id1)).not.toBe(getRequestIdValue(id2));
    });
  });

  describe('createRequestId', () => {
    it('有効な値からリクエストIDを作成する', () => {
      const value = 'req-123-abc';
      const requestId = createRequestId(value);
      expect(getRequestIdValue(requestId)).toBe(value);
    });

    it('前後の空白を除去する', () => {
      const requestId = createRequestId('  req-123  ');
      expect(getRequestIdValue(requestId)).toBe('req-123');
    });

    it('空の値を拒否する', () => {
      expect(() => createRequestId('')).toThrow('RequestId cannot be empty');
      expect(() => createRequestId('   ')).toThrow('RequestId cannot be empty');
    });

    it('UUID形式の値を受け入れる', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const requestId = createRequestId(uuid);
      expect(getRequestIdValue(requestId)).toBe(uuid);
    });
  });

  describe('equalsRequestId', () => {
    it('同じ値のリクエストIDは等しい', () => {
      const id1 = createRequestId('req-123');
      const id2 = createRequestId('req-123');
      expect(equalsRequestId(id1, id2)).toBe(true);
    });

    it('異なる値のリクエストIDは等しくない', () => {
      const id1 = createRequestId('req-123');
      const id2 = createRequestId('req-456');
      expect(equalsRequestId(id1, id2)).toBe(false);
    });

    it('生成されたIDと作成されたIDの比較', () => {
      const generated = generateRequestId();
      const created = createRequestId(getRequestIdValue(generated));
      expect(equalsRequestId(generated, created)).toBe(true);
    });
  });

  describe('ユースケース', () => {
    it('APIリクエストのトレーシングに使用できる', () => {
      // リクエスト受信時にIDを生成
      const requestId = generateRequestId();

      // ログに記録
      const logEntry = {
        requestId: getRequestIdValue(requestId),
        timestamp: new Date(),
        path: '/api/data',
      };

      // 後で同じリクエストIDで検索可能
      const searchId = createRequestId(logEntry.requestId);
      expect(equalsRequestId(requestId, searchId)).toBe(true);
    });
  });
});
