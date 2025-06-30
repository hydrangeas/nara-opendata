import fastifySensible from '@fastify/sensible';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

/**
 * Fastify Sensibleプラグイン
 *
 * @remarks
 * 便利なユーティリティやHTTPエラーを追加
 */
const sensiblePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifySensible);
};

export default fp(sensiblePlugin, {
  name: 'sensible',
});
