import { describe, it, expect } from 'vitest';
import { generateLogId, createLogId, getLogIdValue, equalsLogId } from './LogId';

describe('LogId', () => {
  describe('generateLogId', () => {
    it('新しいログIDを生成する', () => {
      const logId = generateLogId();
      expect(getLogIdValue(logId)).toBeDefined();
      expect(getLogIdValue(logId)).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('生成されるIDは小文字である', () => {
      const logId = generateLogId();
      const value = getLogIdValue(logId);
      expect(value).toBe(value.toLowerCase());
    });

    it('毎回異なるIDを生成する', () => {
      const logId1 = generateLogId();
      const logId2 = generateLogId();
      expect(getLogIdValue(logId1)).not.toBe(getLogIdValue(logId2));
    });
  });

  describe('createLogId', () => {
    it('既存の値からログIDを作成する', () => {
      const value = '550e8400-e29b-41d4-a716-446655440000';
      const logId = createLogId(value);
      expect(getLogIdValue(logId)).toBe(value);
    });

    it('空文字列を拒否する', () => {
      expect(() => createLogId('')).toThrow('LogId cannot be empty');
    });

    it('空白のみの文字列を拒否する', () => {
      expect(() => createLogId('  ')).toThrow('LogId cannot be empty');
    });

    it('前後の空白を削除する', () => {
      const value = '550e8400-e29b-41d4-a716-446655440000';
      const logId = createLogId(`  ${value}  `);
      expect(getLogIdValue(logId)).toBe(value);
    });

    it('undefinedやnullを拒否する', () => {
      expect(() => createLogId(undefined as any)).toThrow();
      expect(() => createLogId(null as any)).toThrow();
    });
  });

  describe('equalsLogId', () => {
    it('同じ値のログIDは等しい', () => {
      const value = '550e8400-e29b-41d4-a716-446655440000';
      const logId1 = createLogId(value);
      const logId2 = createLogId(value);
      expect(equalsLogId(logId1, logId2)).toBe(true);
    });

    it('異なる値のログIDは等しくない', () => {
      const logId1 = generateLogId();
      const logId2 = generateLogId();
      expect(equalsLogId(logId1, logId2)).toBe(false);
    });
  });
});
