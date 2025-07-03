/**
 * DIコンテナの設定
 *
 * TSyringeを使用した依存性注入の設定を行います。
 * このファイルは、アプリケーション起動時に一度だけ実行されます。
 */

import 'reflect-metadata';
import { container } from 'tsyringe';
import { TYPES, type IDIContainerConfig } from './types/di';

// Import domain services
import { AuthenticationServiceClass } from './contexts/authentication/domain/services/AuthenticationService.class';
import { APIAccessControlServiceClass } from './contexts/api/domain/services/APIAccessControlService.class';
import { DataAccessServiceClass } from './contexts/data/domain/services/DataAccessService.class';
import { LogAnalysisServiceClass } from './contexts/log/domain/services/LogAnalysisService.class';

// Import repository interfaces
import type { IOpenDataRepository } from './contexts/data/domain/repositories/IOpenDataRepository';
import type { IRateLimitRepository } from './contexts/api/domain/repositories/IRateLimitRepository';
import type { IAPILogRepository } from './contexts/log/domain/repositories/IAPILogRepository';
import type { IAuthLogRepository } from './contexts/log/domain/repositories/IAuthLogRepository';
import type { IAPIEndpointRepository } from './contexts/api/domain/repositories/IAPIEndpointRepository';

// Import infrastructure services
import type { IEventBus, ILogger } from '@nara-opendata/shared-kernel';
import {
  InMemoryEventBus,
  ConsoleLogger,
  OpenDataRepositoryImpl,
} from '@nara-opendata/infrastructure';
import { OpenDataRepositoryAdapter } from './infrastructure/repositories/OpenDataRepositoryAdapter';

/**
 * DIコンテナを初期化します
 *
 * @param config - DIコンテナの設定オプション
 * @remarks
 * - アプリケーション起動時に一度だけ呼び出す
 * - テストモードの場合は、モックサービスが登録される
 * - カスタムバインディングが優先される
 */
export function initializeContainer(config: IDIContainerConfig = {}): void {
  const { isTestMode = false, customBindings = [] } = config;

  // Clear container for fresh initialization (useful for tests)
  container.clearInstances();

  // Register infrastructure services
  container.register<ILogger>(TYPES.ILogger, {
    useFactory: () => new ConsoleLogger(),
  });

  container.register<IEventBus>(TYPES.IEventBus, {
    useFactory: () => new InMemoryEventBus(),
  });

  // Register domain services
  container.register(TYPES.AuthenticationService, {
    useClass: AuthenticationServiceClass,
  });

  container.register(TYPES.APIAccessControlService, {
    useClass: APIAccessControlServiceClass,
  });

  container.register(TYPES.DataAccessService, {
    useClass: DataAccessServiceClass,
  });

  container.register(TYPES.LogAnalysisService, {
    useClass: LogAnalysisServiceClass,
  });

  // Register repository implementations
  // Note: These will be implemented in future tasks
  // For now, we'll add placeholder registrations that will throw errors if used

  if (!isTestMode) {
    // Production implementations
    // Register the infrastructure implementation
    container.register(OpenDataRepositoryImpl, { useClass: OpenDataRepositoryImpl });

    // Register the adapter
    container.register<IOpenDataRepository>(TYPES.IOpenDataRepository, {
      useClass: OpenDataRepositoryAdapter,
    });

    container.register<IRateLimitRepository>(TYPES.IRateLimitRepository, {
      useFactory: () => {
        throw new Error('IRateLimitRepository implementation not yet available');
      },
    });

    container.register<IAPILogRepository>(TYPES.IAPILogRepository, {
      useFactory: () => {
        throw new Error('IAPILogRepository implementation not yet available');
      },
    });

    container.register<IAuthLogRepository>(TYPES.IAuthLogRepository, {
      useFactory: () => {
        throw new Error('IAuthLogRepository implementation not yet available');
      },
    });

    container.register<IAPIEndpointRepository>(TYPES.IAPIEndpointRepository, {
      useFactory: () => {
        throw new Error('IAPIEndpointRepository implementation not yet available');
      },
    });
  }

  // Apply custom bindings (these override any previous registrations)
  customBindings.forEach(({ token, useClass, useValue, useFactory }) => {
    if (useClass) {
      container.register(token, { useClass });
    } else if (useValue !== undefined) {
      container.register(token, { useValue });
    } else if (useFactory) {
      container.register(token, { useFactory });
    }
  });
}

/**
 * DIコンテナからインスタンスを解決します
 *
 * @template T - 解決する型
 * @param token - DIトークン
 * @returns 解決されたインスタンス
 * @remarks
 * 型安全なヘルパー関数として提供
 */
export function resolve<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * 静的サービスを初期化します
 *
 * @remarks
 * 後方互換性のために静的サービスクラスの初期化を実行
 */
export async function initializeStaticServices(): Promise<void> {
  // 静的サービスの初期化
  const { initializeStaticServices: init } = await import(
    './contexts/shared/infrastructure/ServiceInitializer'
  );
  init();
}

/**
 * DIコンテナにシングルトンを登録します
 *
 * @template T - 登録する型
 * @param token - DIトークン
 * @param instance - インスタンス
 * @remarks
 * テスト時にモックを登録する際に使用
 */
export function registerSingleton<T>(token: symbol, instance: T): void {
  container.register(token, { useValue: instance });
}

/**
 * DIコンテナをリセットします
 *
 * @remarks
 * テスト時に各テストケース間でクリーンな状態を保つために使用
 */
export function resetContainer(): void {
  container.reset();
  container.clearInstances();
}

// Export the container for advanced use cases
export { container };
