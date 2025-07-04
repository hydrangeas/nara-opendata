import { describe, it, expect } from 'vitest';
import { createUserId, equalsUserId } from './UserId';

describe('UserId', () => {
  describe('createUserId', () => {
    it('有効なUUIDからUserIdを作成できる', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId = createUserId(validUuid);
      expect(userId).toBe(validUuid);
    });

    it('空文字列を拒否する', () => {
      expect(() => createUserId('')).toThrow('UserId cannot be empty');
    });

    it('空白文字列を拒否する', () => {
      expect(() => createUserId('   ')).toThrow('UserId cannot be empty');
    });

    it('無効なUUID形式を拒否する', () => {
      expect(() => createUserId('invalid-uuid')).toThrow('UserId must be a valid UUID');
      expect(() => createUserId('123')).toThrow('UserId must be a valid UUID');
      expect(() => createUserId('123e4567-e89b-12d3-a456-42661417400g')).toThrow(
        'UserId must be a valid UUID',
      );
    });

    it('非文字列型の値を拒否する', () => {
      // @ts-expect-error - テストのため意図的に型エラーを無視
      expect(() => createUserId(123)).toThrow('UserId must be a string');
      // @ts-expect-error - テストのため意図的に型エラーを無視
      expect(() => createUserId(null)).toThrow('UserId must be a string');
      // @ts-expect-error - テストのため意図的に型エラーを無視
      expect(() => createUserId(undefined)).toThrow('UserId must be a string');
      // @ts-expect-error - テストのため意図的に型エラーを無視
      expect(() => createUserId({})).toThrow('UserId must be a string');
      // @ts-expect-error - テストのため意図的に型エラーを無視
      expect(() => createUserId([])).toThrow('UserId must be a string');
    });

    it('大文字小文字を区別せず受け入れ、小文字に正規化する', () => {
      const upperCase = '123E4567-E89B-12D3-A456-426614174000';
      const lowerCase = '123e4567-e89b-12d3-a456-426614174000';
      const mixedCase = '123e4567-E89B-12d3-A456-426614174000';

      // すべて小文字に正規化される
      expect(createUserId(upperCase)).toBe(lowerCase);
      expect(createUserId(lowerCase)).toBe(lowerCase);
      expect(createUserId(mixedCase)).toBe(lowerCase);
    });
  });

  describe('equalsUserId', () => {
    it('同じUserIdは等しい', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const userId1 = createUserId(uuid);
      const userId2 = createUserId(uuid);

      expect(equalsUserId(userId1, userId2)).toBe(true);
    });

    it('異なるUserIdは等しくない', () => {
      const userId1 = createUserId('123e4567-e89b-12d3-a456-426614174000');
      const userId2 = createUserId('987f6543-e21b-12d3-a456-426614174000');

      expect(equalsUserId(userId1, userId2)).toBe(false);
    });

    it('大文字小文字が異なっても同じUUIDなら等しい', () => {
      const upperCase = '123E4567-E89B-12D3-A456-426614174000';
      const lowerCase = '123e4567-e89b-12d3-a456-426614174000';

      const userId1 = createUserId(upperCase);
      const userId2 = createUserId(lowerCase);

      expect(equalsUserId(userId1, userId2)).toBe(true);
    });
  });
});
