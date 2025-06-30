import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/**
 * 基本的なエラーレスポンスの型
 *
 * @remarks
 * RFC 7807の詳細な実装はtask-0036で行う
 * ここでは最小限の実装のみ
 */
interface IErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

/**
 * Fastifyのエラーハンドラー
 *
 * @remarks
 * 基本的なエラーハンドリングのみ実装
 * RFC 7807準拠の詳細な実装はtask-0036で行う
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const { statusCode = 500 } = error;
  const timestamp = new Date().toISOString();
  const path = request.url;

  // ログ出力
  if (statusCode >= 500) {
    request.log.error(error);
  } else if (statusCode >= 400) {
    request.log.warn(error);
  }

  // Validation errorの場合
  if (error.validation) {
    const response: IErrorResponse = {
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      timestamp,
      path,
    };

    await reply.status(400).send(response);
    return;
  }

  // 一般的なエラーレスポンス
  const response: IErrorResponse = {
    statusCode,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    timestamp,
    path,
  };

  await reply.status(statusCode).send(response);
}

/**
 * Not Foundハンドラー
 */
export async function notFoundHandler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const response: IErrorResponse = {
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  await reply.status(404).send(response);
}
