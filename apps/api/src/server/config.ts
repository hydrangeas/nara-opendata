import type { FastifyEnvOptions } from '@fastify/env';

/**
 * 環境変数のスキーマ定義
 */
export const envSchema: FastifyEnvOptions = {
  confKey: 'config',
  schema: {
    type: 'object',
    required: ['NODE_ENV'],
    properties: {
      NODE_ENV: {
        type: 'string',
        enum: ['development', 'production', 'test'],
        default: 'development',
      },
      PORT: {
        type: 'number',
        default: 3000,
      },
      HOST: {
        type: 'string',
        default: '0.0.0.0',
      },
      LOG_LEVEL: {
        type: 'string',
        enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
        default: 'info',
      },
      // データディレクトリのパス（今後の実装で使用）
      DATA_DIR: {
        type: 'string',
        default: './data',
      },
      // API設定
      API_PREFIX: {
        type: 'string',
        default: '/api',
      },
      API_VERSION: {
        type: 'string',
        default: 'v1',
      },
      // CORS設定
      CORS_ORIGIN: {
        type: 'string',
        default: '*',
      },
      // アプリケーション情報
      APP_NAME: {
        type: 'string',
        default: 'nara-opendata-api',
      },
      APP_VERSION: {
        type: 'string',
        default: '0.0.0',
      },
    },
  },
  dotenv: {
    path: process.env['NODE_ENV'] === 'test' ? '.env.test' : '.env',
  },
};

/**
 * 環境変数の型定義
 */
export interface IConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  DATA_DIR: string;
  API_PREFIX: string;
  API_VERSION: string;
  CORS_ORIGIN: string;
  APP_NAME: string;
  APP_VERSION: string;
}

// Fastifyの型定義を拡張
declare module 'fastify' {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface FastifyInstance {
    config: IConfig;
  }
}
