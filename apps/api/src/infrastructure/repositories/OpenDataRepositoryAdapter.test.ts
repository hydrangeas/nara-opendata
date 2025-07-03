import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';
import { OpenDataRepositoryImpl } from '@nara-opendata/infrastructure';
import { OpenDataRepositoryAdapter } from './OpenDataRepositoryAdapter';
import { createFilePath } from '../../contexts/data/domain/value-objects/FilePath';
import type { IOpenDataResource } from '@nara-opendata/infrastructure';

describe('OpenDataRepositoryAdapter', () => {
  beforeEach(() => {
    container.clearInstances();
  });

  describe('Dependency Injection', () => {
    it('インジェクションを通じて正しく構築される', () => {
      // Arrange
      container.register(OpenDataRepositoryImpl, { useClass: OpenDataRepositoryImpl });

      // Act
      const adapter = container.resolve(OpenDataRepositoryAdapter);

      // Assert
      expect(adapter).toBeInstanceOf(OpenDataRepositoryAdapter);
    });

    it('モックされた実装を注入できる', async () => {
      // Arrange
      const mockResource: IOpenDataResource = {
        path: { value: 'test/file.json' },
        contentType: { value: 'application/json' },
        fileSize: { bytes: 1024 },
      };

      const mockImpl = {
        findByPath: vi.fn().mockResolvedValue(mockResource),
        exists: vi.fn(),
        getContent: vi.fn(),
        listByPathPrefix: vi.fn(),
      };

      container.register(OpenDataRepositoryImpl, { useValue: mockImpl as any });

      // Act
      const adapter = container.resolve(OpenDataRepositoryAdapter);
      const path = createFilePath('test/file.json');
      const result = await adapter.findByPath(path);

      // Assert
      expect(mockImpl.findByPath).toHaveBeenCalledWith({ value: 'test/file.json' });
      expect(result).toBeTruthy();
      expect(result?.path.value).toBe('test/file.json');
    });
  });

  describe('Type conversion', () => {
    it('インフラ層の型をドメイン層の型に正しく変換する', async () => {
      // Arrange
      const mockResource: IOpenDataResource = {
        path: { value: 'data/test.csv' },
        contentType: { value: 'text/csv' },
        fileSize: { bytes: 2048 },
      };

      const mockImpl = {
        findByPath: vi.fn().mockResolvedValue(mockResource),
        exists: vi.fn(),
        getContent: vi.fn(),
        listByPathPrefix: vi.fn(),
      };

      container.register(OpenDataRepositoryImpl, { useValue: mockImpl as any });

      // Act
      const adapter = container.resolve(OpenDataRepositoryAdapter);
      const path = createFilePath('data/test.csv');
      const result = await adapter.findByPath(path);

      // Assert
      expect(result).toBeTruthy();
      expect(result?.path.value).toBe('data/test.csv');
      expect(result?.contentType.value).toBe('text/csv');
      expect(result?.fileSize?.bytes).toBe(2048);
    });

    it('nullの結果を正しく処理する', async () => {
      // Arrange
      const mockImpl = {
        findByPath: vi.fn().mockResolvedValue(null),
        exists: vi.fn(),
        getContent: vi.fn(),
        listByPathPrefix: vi.fn(),
      };

      container.register(OpenDataRepositoryImpl, { useValue: mockImpl as any });

      // Act
      const adapter = container.resolve(OpenDataRepositoryAdapter);
      const path = createFilePath('nonexistent/file.json');
      const result = await adapter.findByPath(path);

      // Assert
      expect(result).toBeNull();
    });
  });
});
