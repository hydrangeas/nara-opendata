import { describe, it, expect } from 'vitest';
import { createLogId, getLogIdValue, equalsLogId, hashCodeLogId, generateLogId } from './LogId';

describe('LogId', () => {
  describe('createLogId', () => {
    it('指定されたUUIDからLogIdを作成する', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const logId = createLogId(uuid);
      expect(getLogIdValue(logId)).toBe(uuid.toLowerCase());
    });

    it('大文字のUUIDを小文字に正規化する', () => {
      const uuid = '123E4567-E89B-42D3-A456-426614174000';
      const logId = createLogId(uuid);
      expect(getLogIdValue(logId)).toBe(uuid.toLowerCase());
    });

    it('無効なUUID形式を拒否する', () => {
      const invalidUuids = [
        'invalid-uuid',
        '123e4567-e89b-12d3-a456-426614174000', // バージョンが4でない
        '123e4567-e89b-42d3-z456-426614174000', // 無効な文字
        '123e4567e89b42d3a456426614174000', // ハイフンなし
      ];

      for (const uuid of invalidUuids) {
        expect(() => createLogId(uuid)).toThrow('Invalid UUID format');
      }
    });

    it('空文字列の場合は新しいUUIDを生成する', () => {
      const logId = createLogId('');
      const value = getLogIdValue(logId);

      // UUID v4形式であることを確認
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuidRegex.test(value)).toBe(true);
    });

    it('引数なしで新しいUUIDを生成する', () => {
      const logId = createLogId();
      const value = getLogIdValue(logId);

      // UUID v4形式であることを確認
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuidRegex.test(value)).toBe(true);
    });
  });

  describe('equalsLogId', () => {
    it('同じ値のLogIdは等しい', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const logId1 = createLogId(uuid);
      const logId2 = createLogId(uuid);
      expect(equalsLogId(logId1, logId2)).toBe(true);
    });

    it('異なる値のLogIdは等しくない', () => {
      const logId1 = createLogId('123e4567-e89b-42d3-a456-426614174000');
      const logId2 = createLogId('987e6543-e21b-42d3-a456-426614174000');
      expect(equalsLogId(logId1, logId2)).toBe(false);
    });
  });

  describe('hashCodeLogId', () => {
    it('LogIdのハッシュコードを返す', () => {
      const uuid = '123e4567-e89b-42d3-a456-426614174000';
      const logId = createLogId(uuid);
      expect(hashCodeLogId(logId)).toBe(uuid.toLowerCase());
    });
  });

  describe('generateLogId', () => {
    it('新しいLogIdを生成する', () => {
      const logId1 = generateLogId();
      const logId2 = generateLogId();

      // 異なるIDが生成されることを確認
      expect(equalsLogId(logId1, logId2)).toBe(false);

      // 両方とも有効なUUID形式であることを確認
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuidRegex.test(getLogIdValue(logId1))).toBe(true);
      expect(uuidRegex.test(getLogIdValue(logId2))).toBe(true);
    });
  });
});
