import fastify from 'fastify';
import fastifyEnv from '@fastify/env';
import type { FastifyInstance, FastifyServerOptions } from 'fastify';

import { envSchema } from './config';
import { createLogger } from './logger';
import { errorHandler, notFoundHandler } from './error-handler';
import { sensiblePlugin, corsPlugin, healthPlugin } from './plugins';

/**
 * Fastifyサーバーインスタンスを作成
 *
 * @param opts - Fastifyサーバーオプション
 * @returns Fastifyインスタンス
 */
export async function createServer(
  opts: Partial<FastifyServerOptions> = {},
): Promise<FastifyInstance> {
  // ロガーを作成
  const logger = createLogger();

  // Fastifyインスタンスを作成
  const server = fastify({
    logger,
    ...opts,
  });

  // 環境変数の設定とバリデーション
  await server.register(fastifyEnv, envSchema);

  // エラーハンドラーの設定
  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);

  // 基本プラグインの登録
  await server.register(sensiblePlugin);
  await server.register(corsPlugin);
  await server.register(healthPlugin);

  // グレースフルシャットダウンの設定
  // Note: シグナルハンドラーは startServer で設定されるため、ここでは設定しない

  // サーバー情報のログ出力
  server.log.info(
    {
      nodeVersion: process.version,
      env: server.config.NODE_ENV,
      appName: server.config.APP_NAME,
      appVersion: server.config.APP_VERSION,
    },
    'Server initialized',
  );

  return server;
}

/**
 * サーバーを起動
 *
 * @param server - Fastifyインスタンス
 * @param opts - 起動オプション
 */
export async function startServer(
  server: FastifyInstance,
  opts?: { port?: number; host?: string },
): Promise<void> {
  const port = opts?.port || server.config.PORT;
  const host = opts?.host || server.config.HOST;

  // グレースフルシャットダウンの設定
  const closeListeners = ['SIGINT', 'SIGTERM'];
  const signalHandlers = new Map<string, NodeJS.SignalsListener>();

  closeListeners.forEach((signal) => {
    const handler = async (): Promise<void> => {
      server.log.info(`Received ${signal}, closing server...`);
      try {
        await server.close();
        server.log.info('Server closed successfully');
        process.exit(0);
      } catch (err) {
        server.log.error(err, 'Error during server close');
        process.exit(1);
      }
    };

    signalHandlers.set(signal, handler);
    process.once(signal as NodeJS.Signals, handler);
  });

  // サーバー終了時にシグナルハンドラーをクリーンアップ
  server.addHook('onClose', async () => {
    signalHandlers.forEach((handler, signal) => {
      process.removeListener(signal as NodeJS.Signals, handler);
    });
  });

  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
