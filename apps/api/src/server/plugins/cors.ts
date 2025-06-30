import fastifyCors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * CORS設定プラグイン
 *
 * @remarks
 * Cross-Origin Resource Sharing (CORS) の設定を行う
 */
const corsPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyCors, {
    origin: (origin, cb) => {
      const allowedOrigins = fastify.config.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

      // 開発環境では全てのオリジンを許可
      if (fastify.config.NODE_ENV === 'development') {
        cb(null, true);
        return;
      }

      // 本番環境では設定されたオリジンのみ許可
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
};

export default fp(corsPlugin, {
  name: 'cors',
});
