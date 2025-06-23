import { describe, it, expect } from 'vitest';
import { DataAccessService } from './DataAccessService';
import { createFilePath } from '../value-objects/FilePath';
import { createContentType } from '../value-objects/ContentType';
import { createFileSize } from '../value-objects/FileSize';
import { createOpenDataResource } from '../value-objects/OpenDataResource';
import { PathTraversalException } from '../exceptions/PathTraversalException';

describe('DataAccessService', () => {
  describe('validateResourcePath', () => {
    it('有効なパスを受け入れる', () => {
      const validPaths = ['secure/319985/r5.json', 'data/2024/report.json', 'api/v1/users.json'];

      for (const path of validPaths) {
        expect(() => DataAccessService.validateResourcePath(path)).not.toThrow();
      }
    });

    it('パストラバーサル攻撃を検出する', () => {
      const dangerousPaths = ['../etc/passwd', 'path/../../../secret', '..%2Fetc%2Fpasswd'];

      for (const path of dangerousPaths) {
        expect(() => DataAccessService.validateResourcePath(path)).toThrow(PathTraversalException);
      }
    });
  });

  describe('createResourceFromUrl', () => {
    it('URLパスからリソースを作成する', () => {
      const resource = DataAccessService.createResourceFromUrl('/secure/319985/r5.json');
      const path = resource.path;
      const contentType = resource.contentType;

      expect(path.value).toBe('secure/319985/r5.json');
      expect(contentType.value).toBe('application/json');
    });

    it('拡張子からコンテンツタイプを推測する', () => {
      const testCases = [
        { url: '/data/report.json', expectedType: 'application/json' },
        { url: '/data/report.xml', expectedType: 'application/xml' },
        { url: '/data/report.csv', expectedType: 'text/csv' },
        { url: '/data/report.txt', expectedType: 'text/plain' },
        { url: '/data/report.pdf', expectedType: 'application/pdf' },
      ];

      for (const { url, expectedType } of testCases) {
        const resource = DataAccessService.createResourceFromUrl(url);
        expect(resource.contentType.value).toBe(expectedType);
      }
    });

    it('不明な拡張子の場合はデフォルトのコンテンツタイプを使用', () => {
      const resource = DataAccessService.createResourceFromUrl('/data/report.xyz');
      expect(resource.contentType.value).toBe('application/octet-stream');
    });

    it('拡張子がない場合はデフォルトのコンテンツタイプを使用', () => {
      const resource = DataAccessService.createResourceFromUrl('/data/report');
      expect(resource.contentType.value).toBe('application/octet-stream');
    });
  });

  describe('validateAccess', () => {
    it('有効なJSONリソースへのアクセスを許可する', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
        fileSize: createFileSize(1024 * 1024), // 1MB
      });

      const result = DataAccessService.validateAccess(resource);
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('大きすぎるファイルへのアクセスを拒否する', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
        fileSize: createFileSize(101 * 1024 * 1024), // 101MB
      });

      const result = DataAccessService.validateAccess(resource);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('File size exceeds maximum allowed size');
    });

    it('許可されていないコンテンツタイプへのアクセスを拒否する', () => {
      const resource = createOpenDataResource({
        path: createFilePath('programs/script.exe'),
        contentType: createContentType('application/x-executable'),
      });

      const result = DataAccessService.validateAccess(resource);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Content type not allowed');
    });

    it('カスタム最大サイズを指定できる', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
        fileSize: createFileSize(5 * 1024 * 1024), // 5MB
      });

      // デフォルトの100MBでは許可
      const result1 = DataAccessService.validateAccess(resource);
      expect(result1.allowed).toBe(true);

      // カスタム1MBでは拒否
      const result2 = DataAccessService.validateAccess(resource, { maxFileSizeBytes: 1024 * 1024 });
      expect(result2.allowed).toBe(false);
      expect(result2.reason).toBe('File size exceeds maximum allowed size');
    });
  });

  describe('buildResourcePath', () => {
    it('ベースパスとファイルパスを結合する', () => {
      const result = DataAccessService.buildResourcePath('/data', 'secure/319985/r5.json');
      expect(result).toBe('/data/secure/319985/r5.json');
    });

    it('重複するスラッシュを正規化する', () => {
      const result = DataAccessService.buildResourcePath('/data/', '/secure/319985/r5.json');
      expect(result).toBe('/data/secure/319985/r5.json');
    });

    it('空のベースパスを処理する', () => {
      const result = DataAccessService.buildResourcePath('', 'secure/319985/r5.json');
      expect(result).toBe('secure/319985/r5.json');
    });
  });

  describe('getContentTypeFromPath', () => {
    it('ファイルパスから適切なコンテンツタイプを推測する', () => {
      const testCases = [
        { path: 'data/report.json', expectedType: 'application/json' },
        { path: 'data/report.JSON', expectedType: 'application/json' }, // 大文字
        { path: 'data/report.xml', expectedType: 'application/xml' },
        { path: 'data/report.csv', expectedType: 'text/csv' },
        { path: 'data/report.txt', expectedType: 'text/plain' },
        { path: 'data/report.pdf', expectedType: 'application/pdf' },
        { path: 'data/report.html', expectedType: 'text/html' },
        { path: 'data/report.xls', expectedType: 'application/vnd.ms-excel' },
        {
          path: 'data/report.xlsx',
          expectedType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ];

      for (const { path, expectedType } of testCases) {
        const contentType = DataAccessService.getContentTypeFromPath(path);
        expect(contentType.value).toBe(expectedType);
      }
    });
  });
});
