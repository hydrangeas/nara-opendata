import { describe, it, expect } from 'vitest';
import {
  createStatusCode,
  getStatusCodeValue,
  equalsStatusCode,
  isSuccessStatusCode,
  isRedirectStatusCode,
  isClientErrorStatusCode,
  isServerErrorStatusCode,
  isErrorStatusCode,
} from './StatusCode';

describe('StatusCode', () => {
  describe('createStatusCode', () => {
    it('有効なステータスコードを作成する', () => {
      const statusCode = createStatusCode(200);
      expect(getStatusCodeValue(statusCode)).toBe(200);
    });

    it('最小値（100）を受け入れる', () => {
      const statusCode = createStatusCode(100);
      expect(getStatusCodeValue(statusCode)).toBe(100);
    });

    it('最大値（599）を受け入れる', () => {
      const statusCode = createStatusCode(599);
      expect(getStatusCodeValue(statusCode)).toBe(599);
    });

    it('無効な値を拒否する', () => {
      expect(() => createStatusCode(99)).toThrow('Invalid status code');
      expect(() => createStatusCode(600)).toThrow('Invalid status code');
      expect(() => createStatusCode(0)).toThrow('Invalid status code');
      expect(() => createStatusCode(-1)).toThrow('Invalid status code');
    });

    it('非整数を拒否する', () => {
      expect(() => createStatusCode(200.5)).toThrow('Invalid status code');
      expect(() => createStatusCode(NaN)).toThrow('Invalid status code');
    });
  });

  describe('equalsStatusCode', () => {
    it('同じ値のステータスコードは等しい', () => {
      const code1 = createStatusCode(200);
      const code2 = createStatusCode(200);
      expect(equalsStatusCode(code1, code2)).toBe(true);
    });

    it('異なる値のステータスコードは等しくない', () => {
      const code1 = createStatusCode(200);
      const code2 = createStatusCode(404);
      expect(equalsStatusCode(code1, code2)).toBe(false);
    });
  });

  describe('ステータスコードカテゴリ判定', () => {
    it('成功ステータスコード（2xx）を判定する', () => {
      expect(isSuccessStatusCode(createStatusCode(200))).toBe(true);
      expect(isSuccessStatusCode(createStatusCode(201))).toBe(true);
      expect(isSuccessStatusCode(createStatusCode(299))).toBe(true);
      expect(isSuccessStatusCode(createStatusCode(300))).toBe(false);
      expect(isSuccessStatusCode(createStatusCode(199))).toBe(false);
    });

    it('リダイレクトステータスコード（3xx）を判定する', () => {
      expect(isRedirectStatusCode(createStatusCode(300))).toBe(true);
      expect(isRedirectStatusCode(createStatusCode(301))).toBe(true);
      expect(isRedirectStatusCode(createStatusCode(399))).toBe(true);
      expect(isRedirectStatusCode(createStatusCode(400))).toBe(false);
      expect(isRedirectStatusCode(createStatusCode(299))).toBe(false);
    });

    it('クライアントエラーステータスコード（4xx）を判定する', () => {
      expect(isClientErrorStatusCode(createStatusCode(400))).toBe(true);
      expect(isClientErrorStatusCode(createStatusCode(404))).toBe(true);
      expect(isClientErrorStatusCode(createStatusCode(499))).toBe(true);
      expect(isClientErrorStatusCode(createStatusCode(500))).toBe(false);
      expect(isClientErrorStatusCode(createStatusCode(399))).toBe(false);
    });

    it('サーバーエラーステータスコード（5xx）を判定する', () => {
      expect(isServerErrorStatusCode(createStatusCode(500))).toBe(true);
      expect(isServerErrorStatusCode(createStatusCode(503))).toBe(true);
      expect(isServerErrorStatusCode(createStatusCode(599))).toBe(true);
      expect(isServerErrorStatusCode(createStatusCode(499))).toBe(false);
      expect(isServerErrorStatusCode(createStatusCode(400))).toBe(false);
    });

    it('エラーステータスコード（4xx または 5xx）を判定する', () => {
      expect(isErrorStatusCode(createStatusCode(400))).toBe(true);
      expect(isErrorStatusCode(createStatusCode(404))).toBe(true);
      expect(isErrorStatusCode(createStatusCode(500))).toBe(true);
      expect(isErrorStatusCode(createStatusCode(503))).toBe(true);
      expect(isErrorStatusCode(createStatusCode(200))).toBe(false);
      expect(isErrorStatusCode(createStatusCode(301))).toBe(false);
    });
  });
});
