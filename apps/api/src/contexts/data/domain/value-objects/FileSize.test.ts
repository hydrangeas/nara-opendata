import { describe, it, expect } from 'vitest';
import {
  createFileSize,
  getFileSizeBytes,
  equalsFileSize,
  formatFileSize,
  isValidFileSize,
} from './FileSize';

describe('FileSize', () => {
  describe('createFileSize', () => {
    it('有効なファイルサイズを受け入れる', () => {
      const validSizes = [0, 1, 1024, 1048576, 1073741824]; // 0B, 1B, 1KB, 1MB, 1GB

      for (const size of validSizes) {
        const fileSize = createFileSize(size);
        expect(getFileSizeBytes(fileSize)).toBe(size);
      }
    });

    it('負の値を拒否する', () => {
      expect(() => createFileSize(-1)).toThrow('File size cannot be negative');
      expect(() => createFileSize(-100)).toThrow('File size cannot be negative');
    });

    it('整数以外の値を拒否する', () => {
      expect(() => createFileSize(1.5)).toThrow('File size must be an integer');
      expect(() => createFileSize(0.1)).toThrow('File size must be an integer');
    });

    it('Number.MAX_SAFE_INTEGERを超える値を拒否する', () => {
      expect(() => createFileSize(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        'File size exceeds maximum safe integer',
      );
    });
  });

  describe('equalsFileSize', () => {
    it('同じサイズのFileSizeは等しい', () => {
      const size1 = createFileSize(1024);
      const size2 = createFileSize(1024);
      expect(equalsFileSize(size1, size2)).toBe(true);
    });

    it('異なるサイズのFileSizeは等しくない', () => {
      const size1 = createFileSize(1024);
      const size2 = createFileSize(2048);
      expect(equalsFileSize(size1, size2)).toBe(false);
    });
  });

  describe('formatFileSize', () => {
    it('バイト単位で表示', () => {
      expect(formatFileSize(createFileSize(0))).toBe('0 B');
      expect(formatFileSize(createFileSize(1))).toBe('1 B');
      expect(formatFileSize(createFileSize(500))).toBe('500 B');
      expect(formatFileSize(createFileSize(1023))).toBe('1023 B');
    });

    it('キロバイト単位で表示', () => {
      expect(formatFileSize(createFileSize(1024))).toBe('1.00 KB');
      expect(formatFileSize(createFileSize(1536))).toBe('1.50 KB');
      expect(formatFileSize(createFileSize(2048))).toBe('2.00 KB');
      expect(formatFileSize(createFileSize(1048575))).toBe('1024.00 KB');
    });

    it('メガバイト単位で表示', () => {
      expect(formatFileSize(createFileSize(1048576))).toBe('1.00 MB');
      expect(formatFileSize(createFileSize(1572864))).toBe('1.50 MB');
      expect(formatFileSize(createFileSize(10485760))).toBe('10.00 MB');
      expect(formatFileSize(createFileSize(1073741823))).toBe('1024.00 MB');
    });

    it('ギガバイト単位で表示', () => {
      expect(formatFileSize(createFileSize(1073741824))).toBe('1.00 GB');
      expect(formatFileSize(createFileSize(1610612736))).toBe('1.50 GB');
      expect(formatFileSize(createFileSize(10737418240))).toBe('10.00 GB');
    });

    it('テラバイト単位で表示', () => {
      expect(formatFileSize(createFileSize(1099511627776))).toBe('1.00 TB');
      expect(formatFileSize(createFileSize(2199023255552))).toBe('2.00 TB');
    });

    it('精度オプションが機能する', () => {
      const size = createFileSize(1536); // 1.5 KB
      expect(formatFileSize(size, 0)).toBe('2 KB');
      expect(formatFileSize(size, 1)).toBe('1.5 KB');
      expect(formatFileSize(size, 2)).toBe('1.50 KB');
      expect(formatFileSize(size, 3)).toBe('1.500 KB');
    });
  });

  describe('isValidFileSize', () => {
    it('最大サイズ以下の場合はtrueを返す', () => {
      const size = createFileSize(1024);
      expect(isValidFileSize(size, 2048)).toBe(true);
      expect(isValidFileSize(size, 1024)).toBe(true);
    });

    it('最大サイズを超える場合はfalseを返す', () => {
      const size = createFileSize(2048);
      expect(isValidFileSize(size, 1024)).toBe(false);
    });

    it('最大サイズが指定されない場合は常にtrueを返す', () => {
      const size = createFileSize(Number.MAX_SAFE_INTEGER);
      expect(isValidFileSize(size)).toBe(true);
    });
  });
});
