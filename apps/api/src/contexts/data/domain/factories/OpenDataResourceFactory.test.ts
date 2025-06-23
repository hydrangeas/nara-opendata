import { describe, it, expect } from 'vitest';
import { OpenDataResourceFactory } from './OpenDataResourceFactory';
import { getFilePathValue } from '../value-objects/FilePath';
import { getContentTypeValue } from '../value-objects/ContentType';
import { getFileSizeBytes } from '../value-objects/FileSize';
import { PathTraversalException } from '../exceptions/PathTraversalException';

describe('OpenDataResourceFactory', () => {
  describe('createFromPath', () => {
    it('パスからリソースを作成し、適切なコンテンツタイプを設定する', () => {
      const testCases = [
        { path: 'data/report.json', expectedType: 'application/json' },
        { path: 'data/report.xml', expectedType: 'application/xml' },
        { path: 'data/report.csv', expectedType: 'text/csv' },
        { path: 'data/report.pdf', expectedType: 'application/pdf' },
      ];

      for (const { path, expectedType } of testCases) {
        const resource = OpenDataResourceFactory.createFromPath(path);
        expect(getFilePathValue(resource.path)).toBe(path);
        expect(getContentTypeValue(resource.contentType)).toBe(expectedType);
        expect(resource.fileSize).toBeUndefined();
      }
    });

    it('ファイルサイズを指定してリソースを作成できる', () => {
      const resource = OpenDataResourceFactory.createFromPath('data/report.json', {
        fileSizeBytes: 1024,
      });
      expect(getFilePathValue(resource.path)).toBe('data/report.json');
      expect(resource.fileSize).toBeDefined();
      if (resource.fileSize) {
        expect(getFileSizeBytes(resource.fileSize)).toBe(1024);
      }
    });

    it('無効なパスの場合は例外をスローする', () => {
      expect(() => OpenDataResourceFactory.createFromPath('../etc/passwd')).toThrow(
        PathTraversalException,
      );
    });
  });

  describe('createFromUrl', () => {
    it('URLパスからリソースを作成する', () => {
      const resource = OpenDataResourceFactory.createFromUrl('/secure/319985/r5.json');
      expect(getFilePathValue(resource.path)).toBe('secure/319985/r5.json');
      expect(getContentTypeValue(resource.contentType)).toBe('application/json');
    });

    it('URLパスの先頭スラッシュを削除する', () => {
      const resource = OpenDataResourceFactory.createFromUrl('///data/report.json');
      expect(getFilePathValue(resource.path)).toBe('data/report.json');
    });

    it('カスタムコンテンツタイプを指定できる', () => {
      const resource = OpenDataResourceFactory.createFromUrl('/data/report.json', {
        contentType: 'application/vnd.api+json',
      });
      expect(getContentTypeValue(resource.contentType)).toBe('application/vnd.api+json');
    });
  });

  describe('createFromFileInfo', () => {
    it('ファイル情報からリソースを作成する', () => {
      const resource = OpenDataResourceFactory.createFromFileInfo({
        path: 'data/report.json',
        contentType: 'application/json',
        sizeBytes: 2048,
      });

      expect(getFilePathValue(resource.path)).toBe('data/report.json');
      expect(getContentTypeValue(resource.contentType)).toBe('application/json');
      expect(resource.fileSize).toBeDefined();
      if (resource.fileSize) {
        expect(getFileSizeBytes(resource.fileSize)).toBe(2048);
      }
    });

    it('コンテンツタイプが指定されない場合は拡張子から推測する', () => {
      const resource = OpenDataResourceFactory.createFromFileInfo({
        path: 'data/report.xml',
        sizeBytes: 2048,
      });

      expect(getContentTypeValue(resource.contentType)).toBe('application/xml');
    });
  });
});
