import type { ILogger } from '@nara-opendata/shared-kernel';

/**
 * コンソールロガー実装
 *
 * ILoggerインターフェースのシンプルなコンソール実装です。
 * 開発環境やテスト環境での使用を想定しています。
 */
export class ConsoleLogger implements ILogger {
  constructor(private readonly context?: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('DEBUG', message, undefined, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('INFO', message, undefined, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('WARN', message, undefined, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    this.log('ERROR', message, error, meta);
  }

  private log(
    level: string,
    message: string,
    error?: Error | unknown,
    meta?: Record<string, unknown>,
  ): void {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const errorStr = error instanceof Error ? `\n${error.stack || error.message}` : '';

    const logMessage = `${timestamp} ${level} ${contextStr} ${message}${metaStr}${errorStr}`;

    switch (level) {
      case 'ERROR':
        console.error(logMessage);
        break;
      case 'WARN':
        console.warn(logMessage);
        break;
      case 'INFO':
        console.info(logMessage);
        break;
      case 'DEBUG':
        console.debug(logMessage);
        break;
      default:
        console.log(logMessage);
    }
  }
}
