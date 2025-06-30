import type { FastifyBaseLogger } from 'fastify';
import type { LoggerOptions } from 'pino';
import pino from 'pino';

/**
 * 開発環境用のPino設定
 */
const developmentOptions: LoggerOptions = {
  level: process.env['LOG_LEVEL'] || 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
    },
  },
};

/**
 * 本番環境用のPino設定
 */
const productionOptions: LoggerOptions = {
  level: process.env['LOG_LEVEL'] || 'info',
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
  serializers: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req: (request: any) => ({
      method: request.method,
      url: request.url,
      remoteAddress: request.ip,
      remotePort: request.socket.remotePort,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: (reply: any) => ({
      statusCode: reply.statusCode,
    }),
  },
};

/**
 * テスト環境用のPino設定
 */
const testOptions: LoggerOptions = {
  level: 'silent',
};

/**
 * 環境に応じたロガー設定を取得
 */
export function getLoggerOptions(): LoggerOptions {
  const env = process.env['NODE_ENV'] || 'development';

  switch (env) {
    case 'production':
      return productionOptions;
    case 'test':
      return testOptions;
    default:
      return developmentOptions;
  }
}

/**
 * ロガーインスタンスを作成
 */
export function createLogger(): FastifyBaseLogger {
  const options = getLoggerOptions();
  return pino(options) as FastifyBaseLogger;
}
