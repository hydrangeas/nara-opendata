import { describe, it, expect } from 'vitest';
import {
  createContentType,
  getContentTypeValue,
  equalsContentType,
  isJsonContentType,
  getExtensionForContentType,
} from './ContentType';

describe('ContentType', () => {
  describe('createContentType', () => {
    it('有効なMIMEタイプを受け入れる', () => {
      const validTypes = [
        'application/json',
        'text/plain',
        'text/html',
        'application/xml',
        'application/pdf',
        'image/png',
        'image/jpeg',
      ];

      for (const type of validTypes) {
        const contentType = createContentType(type);
        expect(getContentTypeValue(contentType)).toBe(type);
      }
    });

    it('大文字小文字を正規化する', () => {
      const contentType = createContentType('Application/JSON');
      expect(getContentTypeValue(contentType)).toBe('application/json');
    });

    it('前後の空白を削除する', () => {
      const contentType = createContentType('  application/json  ');
      expect(getContentTypeValue(contentType)).toBe('application/json');
    });

    it('空文字を拒否する', () => {
      expect(() => createContentType('')).toThrow('Content type cannot be empty');
      expect(() => createContentType('  ')).toThrow('Content type cannot be empty');
    });

    it('無効なMIMEタイプを拒否する', () => {
      const invalidTypes = [
        'invalid',
        'application',
        '/json',
        'application/',
        'application//json',
        'app lication/json',
        'application/json/extra',
        'application/json;',
        'application/json charset=utf-8', // セミコロンがない
      ];

      for (const type of invalidTypes) {
        expect(() => createContentType(type)).toThrow('Invalid MIME type format');
      }
    });

    it('パラメータ付きのMIMEタイプを受け入れる', () => {
      const typesWithParams = [
        'application/json; charset=utf-8',
        'text/html; charset=UTF-8',
        'multipart/form-data; boundary=something',
      ];

      for (const type of typesWithParams) {
        const contentType = createContentType(type);
        expect(getContentTypeValue(contentType)).toBe(type.toLowerCase());
      }
    });
  });

  describe('equalsContentType', () => {
    it('同じMIMEタイプのContentTypeは等しい', () => {
      const type1 = createContentType('application/json');
      const type2 = createContentType('application/json');
      expect(equalsContentType(type1, type2)).toBe(true);
    });

    it('異なるMIMEタイプのContentTypeは等しくない', () => {
      const type1 = createContentType('application/json');
      const type2 = createContentType('text/plain');
      expect(equalsContentType(type1, type2)).toBe(false);
    });

    it('大文字小文字の違いは無視される', () => {
      const type1 = createContentType('Application/JSON');
      const type2 = createContentType('application/json');
      expect(equalsContentType(type1, type2)).toBe(true);
    });
  });

  describe('isJsonContentType', () => {
    it('JSONのMIMEタイプを正しく判定する', () => {
      const jsonTypes = [
        'application/json',
        'application/json; charset=utf-8',
        'application/vnd.api+json',
        'application/ld+json',
      ];

      for (const type of jsonTypes) {
        const contentType = createContentType(type);
        expect(isJsonContentType(contentType)).toBe(true);
      }
    });

    it('非JSONのMIMEタイプを正しく判定する', () => {
      const nonJsonTypes = ['text/plain', 'text/html', 'application/xml', 'application/pdf'];

      for (const type of nonJsonTypes) {
        const contentType = createContentType(type);
        expect(isJsonContentType(contentType)).toBe(false);
      }
    });
  });

  describe('getExtensionForContentType', () => {
    it('一般的なMIMEタイプに対して正しい拡張子を返す', () => {
      const mappings = [
        { type: 'application/json', ext: '.json' },
        { type: 'text/plain', ext: '.txt' },
        { type: 'text/html', ext: '.html' },
        { type: 'application/xml', ext: '.xml' },
        { type: 'application/pdf', ext: '.pdf' },
        { type: 'image/png', ext: '.png' },
        { type: 'image/jpeg', ext: '.jpg' },
        { type: 'text/csv', ext: '.csv' },
        { type: 'application/vnd.ms-excel', ext: '.xls' },
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx' },
        { type: 'application/zip', ext: '.zip' },
        { type: 'application/gzip', ext: '.gz' },
        { type: 'application/x-bzip2', ext: '.bz2' },
        { type: 'application/x-xz', ext: '.xz' },
      ];

      for (const { type, ext } of mappings) {
        const contentType = createContentType(type);
        expect(getExtensionForContentType(contentType)).toBe(ext);
      }
    });

    it('パラメータ付きのMIMEタイプでも正しく動作する', () => {
      const contentType = createContentType('application/json; charset=utf-8');
      expect(getExtensionForContentType(contentType)).toBe('.json');
    });

    it('未知のMIMEタイプの場合は空文字を返す', () => {
      const contentType = createContentType('application/unknown');
      expect(getExtensionForContentType(contentType)).toBe('');
    });
  });
});
