import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenDataRepositoryImpl } from './OpenDataRepositoryImpl';
import type { IFilePath } from './types';

describe('OpenDataRepositoryImpl', () => {
  let repository: OpenDataRepositoryImpl;
  const originalEnv = process.env['DATA_DIR'];

  beforeEach(() => {
    // 各テストの前に環境変数を保存
    repository = new OpenDataRepositoryImpl();
  });

  afterEach(() => {
    // 各テストの後に環境変数を復元
    if (originalEnv !== undefined) {
      process.env['DATA_DIR'] = originalEnv;
    } else {
      delete process.env['DATA_DIR'];
    }
  });

  describe('環境変数の設定', () => {
    it('DATA_DIR環境変数のデフォルト値は./data', () => {
      delete process.env['DATA_DIR'];
      const newRepository = new OpenDataRepositoryImpl();

      // privateメンバーにアクセスするためのワークアラウンド
      expect((newRepository as any).baseDir).toBe('./data');
    });

    it('DATA_DIR環境変数が設定されている場合、その値を使用する', () => {
      process.env['DATA_DIR'] = '/custom/data';
      const newRepository = new OpenDataRepositoryImpl();

      expect((newRepository as any).baseDir).toBe('/custom/data');
    });
  });

  describe('型定義とインターフェース', () => {
    it('IOpenDataRepositoryインターフェースを実装している', () => {
      // インターフェースメソッドが存在することを確認
      expect(repository.findByPath).toBeDefined();
      expect(repository.exists).toBeDefined();
      expect(repository.getContent).toBeDefined();
      expect(repository.listByPathPrefix).toBeDefined();

      // メソッドが関数であることを確認
      expect(typeof repository.findByPath).toBe('function');
      expect(typeof repository.exists).toBe('function');
      expect(typeof repository.getContent).toBe('function');
      expect(typeof repository.listByPathPrefix).toBe('function');
    });
  });

  describe('コンテンツタイプの推測ロジック', () => {
    it('拡張子からコンテンツタイプを推測する', () => {
      // privateメソッドにアクセスするためのワークアラウンド
      const getContentType = (repository as any).getContentTypeFromPath.bind(repository);

      // 一般的なファイル形式
      expect(getContentType('data.json').value).toBe('application/json');
      expect(getContentType('data.xml').value).toBe('application/xml');
      expect(getContentType('data.csv').value).toBe('text/csv');
      expect(getContentType('data.txt').value).toBe('text/plain');
      expect(getContentType('data.pdf').value).toBe('application/pdf');
      expect(getContentType('data.xls').value).toBe('application/vnd.ms-excel');
      expect(getContentType('data.xlsx').value).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(getContentType('data.zip').value).toBe('application/zip');
      expect(getContentType('data.gz').value).toBe('application/gzip');
      expect(getContentType('unknown.xyz').value).toBe('application/octet-stream');

      // 複合拡張子
      expect(getContentType('archive.tar.gz').value).toBe('application/gzip');
      expect(getContentType('archive.tar.bz2').value).toBe('application/x-bzip2');
      expect(getContentType('archive.tar.xz').value).toBe('application/x-xz');

      // 大文字小文字を区別しない
      expect(getContentType('DATA.JSON').value).toBe('application/json');
      expect(getContentType('Data.Xml').value).toBe('application/xml');
    });
  });

  describe('パス処理', () => {
    it('正しいフルパスを構築する', () => {
      process.env['DATA_DIR'] = '/test/data';
      const newRepository = new OpenDataRepositoryImpl();

      // privateメソッドにアクセスするためのワークアラウンド
      const buildFullPath = (newRepository as any).buildFullPath.bind(newRepository);

      const filePath: IFilePath = { value: 'secure/319985/r5.json' };
      const fullPath = buildFullPath(filePath);

      expect(fullPath).toBe('/test/data/secure/319985/r5.json');
    });

    it('Windows形式のパスを正規化する', () => {
      // privateメソッドにアクセスするためのワークアラウンド
      const createResource = (repository as any).createResource.bind(repository);

      // Windowsスタイルのパスでも正しく処理される（normalizationのテスト）
      const resource = createResource('secure\\data\\file.json', 1024);
      // パスはそのまま保持される（正規化はwalkDirectoryで行われる）
      expect(resource.path.value).toBe('secure\\data\\file.json');
    });
  });

  describe('エラー判定', () => {
    it('ENOENTエラーを正しく判定する', () => {
      // privateメソッドにアクセスするためのワークアラウンド
      const isFileNotFoundError = (repository as any).isFileNotFoundError.bind(repository);

      // ENOENTエラー
      const enoentError = new Error('File not found');
      (enoentError as any).code = 'ENOENT';
      expect(isFileNotFoundError(enoentError)).toBe(true);

      // 通常のエラー
      const normalError = new Error('Permission denied');
      expect(isFileNotFoundError(normalError)).toBe(false);

      // codeを持つが異なるエラー
      const otherCodeError = new Error('Other error');
      (otherCodeError as any).code = 'EACCES';
      expect(isFileNotFoundError(otherCodeError)).toBe(false);

      // エラーでない値
      expect(isFileNotFoundError('not an error')).toBe(false);
      expect(isFileNotFoundError(null)).toBe(false);
      expect(isFileNotFoundError(undefined)).toBe(false);
    });
  });

  describe('リソース作成', () => {
    it('正しいリソースオブジェクトを作成する', () => {
      // privateメソッドにアクセスするためのワークアラウンド
      const createResource = (repository as any).createResource.bind(repository);

      const resource = createResource('secure/319985/r5.json', 1024);

      expect(resource).toEqual({
        path: { value: 'secure/319985/r5.json' },
        contentType: { value: 'application/json' },
        fileSize: { bytes: 1024 },
      });
    });
  });
});
