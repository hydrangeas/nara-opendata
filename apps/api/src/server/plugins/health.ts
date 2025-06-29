import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * ヘルスチェックレスポンスの型
 */
interface IHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

/**
 * ヘルスチェックプラグイン
 *
 * @remarks
 * 基本的なヘルスチェックエンドポイントを提供
 * 詳細なメトリクスはtask-0037で実装
 */
const healthPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const response: IHealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: fastify.config.NODE_ENV,
      version: fastify.config.APP_VERSION,
    };

    return reply.send(response);
  });

  fastify.get('/ping', async (_request, reply) => {
    return reply.send({ pong: true });
  });
};

export default fp(healthPlugin, {
  name: 'health',
});
