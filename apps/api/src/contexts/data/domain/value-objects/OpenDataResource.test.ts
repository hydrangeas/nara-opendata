import { describe, it, expect } from 'vitest';
import {
  createOpenDataResource,
  getResourcePath,
  getResourceContentType,
  getResourceFileSize,
  equalsOpenDataResource,
  isResourceAccessible,
} from './OpenDataResource';
import { createFilePath } from './FilePath';
import { createContentType } from './ContentType';
import { createFileSize } from './FileSize';

describe('OpenDataResource', () => {
  describe('createOpenDataResource', () => {
    it('有効なリソース情報からリソースを作成できる', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType = createContentType('application/json');
      const fileSize = createFileSize(1024);

      const resource = createOpenDataResource({
        path,
        contentType,
        fileSize,
      });

      expect(getResourcePath(resource)).toBe(path);
      expect(getResourceContentType(resource)).toBe(contentType);
      expect(getResourceFileSize(resource)).toBe(fileSize);
    });

    it('ファイルサイズがオプショナルでも作成できる', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType = createContentType('application/json');

      const resource = createOpenDataResource({
        path,
        contentType,
      });

      expect(getResourcePath(resource)).toBe(path);
      expect(getResourceContentType(resource)).toBe(contentType);
      expect(getResourceFileSize(resource)).toBeUndefined();
    });
  });

  describe('equalsOpenDataResource', () => {
    it('同じパスとコンテンツタイプのリソースは等しい', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType = createContentType('application/json');
      const fileSize = createFileSize(1024);

      const resource1 = createOpenDataResource({ path, contentType, fileSize });
      const resource2 = createOpenDataResource({ path, contentType, fileSize });

      expect(equalsOpenDataResource(resource1, resource2)).toBe(true);
    });

    it('パスが異なるリソースは等しくない', () => {
      const path1 = createFilePath('secure/319985/r5.json');
      const path2 = createFilePath('secure/319985/r6.json');
      const contentType = createContentType('application/json');

      const resource1 = createOpenDataResource({ path: path1, contentType });
      const resource2 = createOpenDataResource({ path: path2, contentType });

      expect(equalsOpenDataResource(resource1, resource2)).toBe(false);
    });

    it('コンテンツタイプが異なるリソースは等しくない', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType1 = createContentType('application/json');
      const contentType2 = createContentType('text/plain');

      const resource1 = createOpenDataResource({ path, contentType: contentType1 });
      const resource2 = createOpenDataResource({ path, contentType: contentType2 });

      expect(equalsOpenDataResource(resource1, resource2)).toBe(false);
    });

    it('ファイルサイズが異なっても、パスとコンテンツタイプが同じなら等しい', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType = createContentType('application/json');
      const fileSize1 = createFileSize(1024);
      const fileSize2 = createFileSize(2048);

      const resource1 = createOpenDataResource({ path, contentType, fileSize: fileSize1 });
      const resource2 = createOpenDataResource({ path, contentType, fileSize: fileSize2 });

      expect(equalsOpenDataResource(resource1, resource2)).toBe(true);
    });

    it('一方のみファイルサイズを持っていても、パスとコンテンツタイプが同じなら等しい', () => {
      const path = createFilePath('secure/319985/r5.json');
      const contentType = createContentType('application/json');
      const fileSize = createFileSize(1024);

      const resource1 = createOpenDataResource({ path, contentType, fileSize });
      const resource2 = createOpenDataResource({ path, contentType });

      expect(equalsOpenDataResource(resource1, resource2)).toBe(true);
    });
  });

  describe('isResourceAccessible', () => {
    it('JSONファイルはアクセス可能', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
      });

      expect(isResourceAccessible(resource)).toBe(true);
    });

    it('XMLファイルはアクセス可能', () => {
      const resource = createOpenDataResource({
        path: createFilePath('data/report.xml'),
        contentType: createContentType('application/xml'),
      });

      expect(isResourceAccessible(resource)).toBe(true);
    });

    it('CSVファイルはアクセス可能', () => {
      const resource = createOpenDataResource({
        path: createFilePath('data/statistics.csv'),
        contentType: createContentType('text/csv'),
      });

      expect(isResourceAccessible(resource)).toBe(true);
    });

    it('PDFファイルはアクセス可能', () => {
      const resource = createOpenDataResource({
        path: createFilePath('documents/report.pdf'),
        contentType: createContentType('application/pdf'),
      });

      expect(isResourceAccessible(resource)).toBe(true);
    });

    it('実行可能ファイルはアクセス不可', () => {
      const resource = createOpenDataResource({
        path: createFilePath('programs/script.exe'),
        contentType: createContentType('application/x-executable'),
      });

      expect(isResourceAccessible(resource)).toBe(false);
    });

    it('最大ファイルサイズを超える場合はアクセス不可', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
        fileSize: createFileSize(101 * 1024 * 1024), // 101MB
      });

      expect(isResourceAccessible(resource, { maxFileSizeBytes: 100 * 1024 * 1024 })).toBe(false);
    });

    it('最大ファイルサイズ以下ならアクセス可能', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
        fileSize: createFileSize(50 * 1024 * 1024), // 50MB
      });

      expect(isResourceAccessible(resource, { maxFileSizeBytes: 100 * 1024 * 1024 })).toBe(true);
    });

    it('ファイルサイズが不明な場合は最大サイズチェックをスキップ', () => {
      const resource = createOpenDataResource({
        path: createFilePath('secure/319985/r5.json'),
        contentType: createContentType('application/json'),
      });

      expect(isResourceAccessible(resource, { maxFileSizeBytes: 100 * 1024 * 1024 })).toBe(true);
    });
  });
});
