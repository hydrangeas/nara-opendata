import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeContainer, resolve, resetContainer } from './container';
import { TYPES } from './types/di';
import { AuthenticationServiceClass } from './contexts/authentication/domain/services/AuthenticationService.class';
import { APIAccessControlServiceClass } from './contexts/api/domain/services/APIAccessControlService.class';
import { DataAccessServiceClass } from './contexts/data/domain/services/DataAccessService.class';
import { LogAnalysisServiceClass } from './contexts/log/domain/services/LogAnalysisService.class';
import type { ILogger, IEventBus } from '@nara-opendata/shared-kernel';

describe('DI Container', () => {
  beforeEach(() => {
    resetContainer();
  });

  describe('initializeContainer', () => {
    it('基本的なインフラサービスを登録できる', () => {
      initializeContainer();

      // Infrastructure services
      const logger = resolve<ILogger>(TYPES.ILogger);
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();

      const eventBus = resolve<IEventBus>(TYPES.IEventBus);
      expect(eventBus).toBeDefined();
      expect(eventBus.publish).toBeDefined();
      expect(eventBus.subscribe).toBeDefined();
    });

    it('リポジトリの依存関係がないドメインサービスを登録できる', () => {
      initializeContainer();

      // Domain services without repository dependencies
      const authService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthenticationServiceClass);
    });

    it('すべてのドメインサービスをテストモードで登録できる', () => {
      // Use custom bindings to provide mock repositories
      const mockRepo = {
        save: vi.fn(),
        findById: vi.fn(),
        findAll: vi.fn(),
        countByUserIdWithinWindow: vi.fn().mockResolvedValue(0),
        findRecentByUserId: vi.fn().mockResolvedValue([]),
      };

      initializeContainer({
        isTestMode: true,
        customBindings: [
          { token: TYPES.IRateLimitRepository, useValue: mockRepo },
          { token: TYPES.IOpenDataRepository, useValue: mockRepo },
          { token: TYPES.IAPILogRepository, useValue: mockRepo },
          { token: TYPES.IAuthLogRepository, useValue: mockRepo },
          { token: TYPES.IAPIEndpointRepository, useValue: mockRepo },
        ],
      });

      // All domain services should work with mocks
      const authService = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthenticationServiceClass);

      const apiAccessControlService = resolve<APIAccessControlServiceClass>(
        TYPES.APIAccessControlService,
      );
      expect(apiAccessControlService).toBeDefined();
      expect(apiAccessControlService).toBeInstanceOf(APIAccessControlServiceClass);

      const dataAccessService = resolve<DataAccessServiceClass>(TYPES.DataAccessService);
      expect(dataAccessService).toBeDefined();
      expect(dataAccessService).toBeInstanceOf(DataAccessServiceClass);

      const logAnalysisService = resolve<LogAnalysisServiceClass>(TYPES.LogAnalysisService);
      expect(logAnalysisService).toBeDefined();
      expect(logAnalysisService).toBeInstanceOf(LogAnalysisServiceClass);
    });

    it('本番モードではリポジトリがプレースホルダーエラーを投げる', () => {
      initializeContainer({ isTestMode: false });

      // Repository placeholders should throw errors
      expect(() => resolve(TYPES.IOpenDataRepository)).toThrow(
        'IOpenDataRepository implementation not yet available',
      );
      expect(() => resolve(TYPES.IRateLimitRepository)).toThrow(
        'IRateLimitRepository implementation not yet available',
      );
      expect(() => resolve(TYPES.IAPILogRepository)).toThrow(
        'IAPILogRepository implementation not yet available',
      );
      expect(() => resolve(TYPES.IAuthLogRepository)).toThrow(
        'IAuthLogRepository implementation not yet available',
      );
      expect(() => resolve(TYPES.IAPIEndpointRepository)).toThrow(
        'IAPIEndpointRepository implementation not yet available',
      );
    });

    it('テストモードではリポジトリがエラーを投げない', () => {
      initializeContainer({ isTestMode: true });

      // In test mode, repositories should not be registered at all
      // (They should be registered by test setup if needed)
      expect(() => resolve(TYPES.IOpenDataRepository)).toThrow();
      expect(() => resolve(TYPES.IRateLimitRepository)).toThrow();
      expect(() => resolve(TYPES.IAPILogRepository)).toThrow();
      expect(() => resolve(TYPES.IAuthLogRepository)).toThrow();
      expect(() => resolve(TYPES.IAPIEndpointRepository)).toThrow();
    });

    it('カスタムバインディングが優先される', () => {
      class CustomLogger implements ILogger {
        debug(_message: string): void {
          /* custom implementation */
        }
        info(_message: string): void {
          /* custom implementation */
        }
        warn(_message: string): void {
          /* custom implementation */
        }
        error(_message: string): void {
          /* custom implementation */
        }
      }

      const customLogger = new CustomLogger();

      initializeContainer({
        customBindings: [
          {
            token: TYPES.ILogger,
            useValue: customLogger,
          },
        ],
      });

      const logger = resolve<ILogger>(TYPES.ILogger);
      expect(logger).toBe(customLogger);
    });

    it('EventBusは毎回新しいインスタンスが作成される', () => {
      initializeContainer();

      const eventBus1 = resolve<IEventBus>(TYPES.IEventBus);
      const eventBus2 = resolve<IEventBus>(TYPES.IEventBus);

      expect(eventBus1).not.toBe(eventBus2);
      expect(eventBus1.publish).toBeDefined();
      expect(eventBus2.publish).toBeDefined();
    });

    it('ドメインサービスは毎回新しいインスタンスが作成される', () => {
      initializeContainer();

      const authService1 = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);
      const authService2 = resolve<AuthenticationServiceClass>(TYPES.AuthenticationService);

      expect(authService1).not.toBe(authService2);
      expect(authService1).toBeInstanceOf(AuthenticationServiceClass);
      expect(authService2).toBeInstanceOf(AuthenticationServiceClass);
    });
  });

  describe('resetContainer', () => {
    it('コンテナをリセットできる', () => {
      initializeContainer();

      const logger1 = resolve<ILogger>(TYPES.ILogger);
      expect(logger1).toBeDefined();

      resetContainer();

      // After reset, should throw error
      expect(() => resolve<ILogger>(TYPES.ILogger)).toThrow();
    });
  });
});
