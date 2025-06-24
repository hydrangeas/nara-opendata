import { describe, it, expect } from 'vitest';
import {
  createAPIPath,
  getAPIPathValue,
  equalsAPIPath,
  matchesPattern,
  getPathSegments,
  extractPathParams,
} from './APIPath';

describe('APIPath', () => {
  describe('createAPIPath', () => {
    it('有効なAPIパスを作成する', () => {
      const validPaths = [
        '/api/v1/users',
        '/secure/319985/r5.json',
        '/data/2024/report.csv',
        '/api/users/{id}',
        '/',
      ];

      for (const path of validPaths) {
        const apiPath = createAPIPath(path);
        expect(getAPIPathValue(apiPath)).toBe(path);
      }
    });

    it('空文字を拒否する', () => {
      expect(() => createAPIPath('')).toThrow('API path cannot be empty');
      expect(() => createAPIPath('  ')).toThrow('API path cannot be empty');
    });

    it('スラッシュで始まらないパスを拒否する', () => {
      expect(() => createAPIPath('api/v1/users')).toThrow('Invalid API path format');
    });

    it('無効な文字を含むパスを拒否する', () => {
      const invalidPaths = ['/api/<script>', '/api/\\test', '/api/\ntest'];

      for (const path of invalidPaths) {
        expect(() => createAPIPath(path)).toThrow('Invalid API path format');
      }
    });

    it('パストラバーサル攻撃を検出して拒否する', () => {
      const pathTraversalPaths = [
        '/api/../secret',
        '/api/./hidden',
        '/api/.hidden',
        '/../etc/passwd',
        '/api/users/../../../etc',
      ];

      for (const path of pathTraversalPaths) {
        expect(() => createAPIPath(path)).toThrow('Path traversal detected in API path');
      }
    });

    it('パーセントエンコード文字列を許可する', () => {
      // 日本語のパーセントエンコード
      const path1 = createAPIPath('/api/%E3%83%87%E3%83%BC%E3%82%BF');
      expect(getAPIPathValue(path1)).toBe('/api/%E3%83%87%E3%83%BC%E3%82%BF');

      // スペースのエンコード
      const path2 = createAPIPath('/api/hello%20world');
      expect(getAPIPathValue(path2)).toBe('/api/hello%20world');

      // 特殊文字のエンコード
      const path3 = createAPIPath('/api/test%2Fpath');
      expect(getAPIPathValue(path3)).toBe('/api/test%2Fpath');
    });
  });

  describe('equalsAPIPath', () => {
    it('同じ値のAPIPathは等しい', () => {
      const path1 = createAPIPath('/api/v1/users');
      const path2 = createAPIPath('/api/v1/users');
      expect(equalsAPIPath(path1, path2)).toBe(true);
    });

    it('異なる値のAPIPathは等しくない', () => {
      const path1 = createAPIPath('/api/v1/users');
      const path2 = createAPIPath('/api/v2/users');
      expect(equalsAPIPath(path1, path2)).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    it('完全一致のパターンをマッチする', () => {
      const apiPath = createAPIPath('/api/v1/users');
      expect(matchesPattern(apiPath, '/api/v1/users')).toBe(true);
      expect(matchesPattern(apiPath, '/api/v1/posts')).toBe(false);
    });

    it('ワイルドカード * を使用したパターンをマッチする', () => {
      const apiPath = createAPIPath('/secure/319985/r5.json');
      expect(matchesPattern(apiPath, '/secure/*/r5.json')).toBe(true);
      expect(matchesPattern(apiPath, '/secure/*/*.json')).toBe(true);
      expect(matchesPattern(apiPath, '/*/*/*')).toBe(true);
      expect(matchesPattern(apiPath, '/secure/*/r6.json')).toBe(false);
    });

    it('パターン内の特殊文字を正しくエスケープする', () => {
      const apiPath = createAPIPath('/api/v1.0/users');
      expect(matchesPattern(apiPath, '/api/v1.0/users')).toBe(true);
      expect(matchesPattern(apiPath, '/api/v1.0/*')).toBe(true);
    });
  });

  describe('getPathSegments', () => {
    it('パスをセグメントに分割する', () => {
      const apiPath = createAPIPath('/api/v1/users');
      expect(getPathSegments(apiPath)).toEqual(['api', 'v1', 'users']);
    });

    it('ルートパスは空配列を返す', () => {
      const apiPath = createAPIPath('/');
      expect(getPathSegments(apiPath)).toEqual([]);
    });

    it('末尾のスラッシュを無視する', () => {
      const apiPath = createAPIPath('/api/v1/');
      expect(getPathSegments(apiPath)).toEqual(['api', 'v1']);
    });
  });

  describe('extractPathParams', () => {
    it('パスパラメータを抽出する', () => {
      const apiPath = createAPIPath('/users/123');
      const params = extractPathParams(apiPath, '/users/{id}');
      expect(params).toEqual({ id: '123' });
    });

    it('複数のパスパラメータを抽出する', () => {
      const apiPath = createAPIPath('/users/123/posts/456');
      const params = extractPathParams(apiPath, '/users/{userId}/posts/{postId}');
      expect(params).toEqual({ userId: '123', postId: '456' });
    });

    it('パターンが一致しない場合は空オブジェクトを返す', () => {
      const apiPath = createAPIPath('/users/123');
      expect(extractPathParams(apiPath, '/posts/{id}')).toEqual({});
      expect(extractPathParams(apiPath, '/users/{id}/posts')).toEqual({});
    });

    it('パラメータがない場合は空オブジェクトを返す', () => {
      const apiPath = createAPIPath('/users');
      const params = extractPathParams(apiPath, '/users');
      expect(params).toEqual({});
    });
  });
});
