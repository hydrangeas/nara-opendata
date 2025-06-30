import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer, startServer } from './server';

describe('Server', () => {
  let server: FastifyInstance;

  beforeEach(async () => {
    // テスト用の環境変数を設定
    process.env['NODE_ENV'] = 'test';
    process.env['LOG_LEVEL'] = 'silent';
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
    vi.clearAllMocks();

    // 環境変数をクリーンアップ
    delete process.env['PORT'];
    delete process.env['HOST'];
    delete process.env['APP_NAME'];
    delete process.env['APP_VERSION'];
  });

  describe('createServer', () => {
    it('サーバーインスタンスを作成できる', async () => {
      server = await createServer();

      expect(server).toBeDefined();
      expect(server.config).toBeDefined();
      expect(server.config.NODE_ENV).toBe('test');
    });

    it('環境変数が正しく設定される', async () => {
      process.env['PORT'] = '4000';
      process.env['HOST'] = '127.0.0.1';
      process.env['APP_NAME'] = 'test-api';
      process.env['APP_VERSION'] = '1.0.0';

      server = await createServer();

      expect(server.config.PORT).toBe(4000);
      expect(server.config.HOST).toBe('127.0.0.1');
      expect(server.config.APP_NAME).toBe('test-api');
      expect(server.config.APP_VERSION).toBe('1.0.0');
    });

    it('デフォルト値が正しく設定される', async () => {
      // 環境変数をクリア
      delete process.env['PORT'];
      delete process.env['HOST'];
      delete process.env['LOG_LEVEL'];
      delete process.env['APP_VERSION'];

      server = await createServer();

      expect(server.config.PORT).toBe(3000);
      expect(server.config.HOST).toBe('0.0.0.0');
      expect(server.config.LOG_LEVEL).toBe('info');
    });
  });

  describe('Health endpoints', () => {
    beforeEach(async () => {
      server = await createServer();
    });

    it('GET /health エンドポイントが正しく動作する', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        status: 'ok',
        environment: 'test',
        version: '0.0.0',
      });
      expect(body.timestamp).toBeDefined();
      expect(body.uptime).toBeDefined();
    });

    it('GET /ping エンドポイントが正しく動作する', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ping',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({ pong: true });
    });
  });

  describe('Error handling', () => {
    beforeEach(async () => {
      server = await createServer();
    });

    it('存在しないルートで404エラーを返す', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/non-existent-route',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        message: 'Route GET /non-existent-route not found',
      });
      expect(body.timestamp).toBeDefined();
      expect(body.path).toBe('/non-existent-route');
    });

    it('不正なメソッドで404エラーを返す', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/health',
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('Route DELETE /health not found');
    });
  });

  describe('Graceful shutdown', () => {
    it('シグナル受信時にサーバーが正しくシャットダウンする', async () => {
      // 新しいサーバーインスタンスを作成
      const testServer = await createServer();
      const closeSpy = vi.spyOn(testServer, 'close');
      const exitSpy = vi
        .spyOn(process, 'exit')
        .mockImplementation((_code?: string | number | null | undefined) => {
          // process.exitを実際には実行しない
          return undefined as never;
        });

      // startServerを呼び出してシグナルハンドラーを登録
      await startServer(testServer, { port: 0, host: '127.0.0.1' });

      // SIGINTシグナルをエミュレート
      process.emit('SIGINT', 'SIGINT');

      // closeが呼ばれるまで待つ
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(closeSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      // クリーンアップ
      exitSpy.mockRestore();
      closeSpy.mockRestore();

      // テスト用サーバーを閉じる
      await testServer.close();
    });
  });
});
