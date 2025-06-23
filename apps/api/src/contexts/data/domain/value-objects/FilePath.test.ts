import { describe, it, expect } from 'vitest';
import {
  createFilePath,
  getFilePathValue,
  equalsFilePath,
  convertUrlPathToFilePath,
} from './FilePath';
import { PathTraversalException } from '../exceptions/PathTraversalException';

describe('FilePath', () => {
  describe('createFilePath', () => {
    it('正常なパスを受け入れる', () => {
      const validPaths = [
        'secure/319985/r5.json',
        'data/2024/report.json',
        'api/v1/users.json',
        'file.txt',
        'path/to/file.json',
      ];

      for (const path of validPaths) {
        const filePath = createFilePath(path);
        expect(getFilePathValue(filePath)).toBe(path);
      }
    });

    it('連続するスラッシュを正規化する', () => {
      const filePath = createFilePath('path//to///file.json');
      expect(getFilePathValue(filePath)).toBe('path/to/file.json');
    });

    it('空文字を拒否する', () => {
      expect(() => createFilePath('')).toThrow('File path cannot be empty');
      expect(() => createFilePath('  ')).toThrow('File path cannot be empty');
    });

    describe('パストラバーサル攻撃を防ぐ', () => {
      it('親ディレクトリ参照を拒否する', () => {
        const dangerousPaths = [
          '../etc/passwd',
          'path/../../../etc/passwd',
          '..\\windows\\system32',
          'path/to/../../../secret',
        ];

        for (const path of dangerousPaths) {
          expect(() => createFilePath(path)).toThrow(PathTraversalException);
        }
      });

      it('URLエンコードされた親ディレクトリ参照を拒否する', () => {
        const encodedPaths = [
          '..%2Fetc%2Fpasswd',
          '..%252Fetc%252Fpasswd', // ダブルエンコード
          '..%5Cwindows%5Csystem32',
          '..%255Cwindows%255Csystem32', // ダブルエンコード
        ];

        for (const path of encodedPaths) {
          expect(() => createFilePath(path)).toThrow(PathTraversalException);
        }
      });

      it('絶対パスを拒否する', () => {
        const absolutePaths = ['/etc/passwd', 'C:\\Windows\\System32', 'D:/secret/file.txt'];

        for (const path of absolutePaths) {
          expect(() => createFilePath(path)).toThrow(PathTraversalException);
        }
      });

      it('nullバイトを拒否する', () => {
        expect(() => createFilePath('file.txt\0.jpg')).toThrow(PathTraversalException);
      });
    });

    it('許可されない文字を拒否する', () => {
      const invalidPaths = [
        'file<script>.txt',
        'path;rm -rf /',
        'file|command',
        'path&command',
        'file(test).txt',
        'path*wildcard',
      ];

      for (const path of invalidPaths) {
        expect(() => createFilePath(path)).toThrow('Invalid characters in file path');
      }
    });
  });

  describe('equalsFilePath', () => {
    it('同じパスのFilePathは等しい', () => {
      const path1 = createFilePath('path/to/file.json');
      const path2 = createFilePath('path/to/file.json');
      expect(equalsFilePath(path1, path2)).toBe(true);
    });

    it('異なるパスのFilePathは等しくない', () => {
      const path1 = createFilePath('path/to/file1.json');
      const path2 = createFilePath('path/to/file2.json');
      expect(equalsFilePath(path1, path2)).toBe(false);
    });
  });

  describe('convertUrlPathToFilePath', () => {
    it('URLパスの先頭スラッシュを削除する', () => {
      const filePath = convertUrlPathToFilePath('/secure/319985/r5.json');
      expect(getFilePathValue(filePath)).toBe('secure/319985/r5.json');
    });

    it('複数の先頭スラッシュを削除する', () => {
      const filePath = convertUrlPathToFilePath('///secure/319985/r5.json');
      expect(getFilePathValue(filePath)).toBe('secure/319985/r5.json');
    });

    it('先頭スラッシュがない場合はそのまま', () => {
      const filePath = convertUrlPathToFilePath('secure/319985/r5.json');
      expect(getFilePathValue(filePath)).toBe('secure/319985/r5.json');
    });
  });
});
