import 'reflect-metadata';
import { createServer, startServer } from './server/server';
import { initializeStaticServices } from './container';

/**
 * メインエントリーポイント
 *
 * @remarks
 * Fastify APIサーバーを起動する
 */
async function main(): Promise<void> {
  try {
    // 静的サービスの初期化（DIコンテナ）
    initializeStaticServices();

    // サーバーインスタンスを作成
    const server = await createServer();

    // サーバーを起動
    await startServer(server);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// プロセスがクラッシュした場合のエラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// メイン関数を実行
void main();
