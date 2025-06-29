import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createServer, startServer } from './server';

describe('Server Integration Tests', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    process.env['NODE_ENV'] = 'test';
    process.env['LOG_LEVEL'] = 'silent';
    process.env['PORT'] = '0'; // ランダムポートを使用

    try {
      server = await createServer();
    } catch (error) {
      console.error('Failed to create server:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Server startup and shutdown', () => {
    it('サーバーが正常に起動できる', async () => {
      await expect(startServer(server, { port: 0, host: '127.0.0.1' })).resolves.not.toThrow();

      // サーバーが実際にリスニングしているか確認
      const addresses = server.addresses();
      expect(addresses).toHaveLength(1);
      expect(addresses[0]).toMatchObject({
        address: '127.0.0.1',
      });
    });

    it('サーバーが正常にシャットダウンできる', async () => {
      await expect(server.close()).resolves.not.toThrow();
    });
  });
});
