import Fastify, { FastifyInstance } from 'fastify'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { config } from './shared/config/env'

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.LOG_LEVEL || 'info',
      transport: config.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        }
      } : undefined
    }
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Register plugins
  await server.register(import('./presentation/plugins/cors'))
  await server.register(import('./presentation/plugins/security'))
  await server.register(import('./presentation/plugins/rateLimit'))
  
  if (config.NODE_ENV !== 'production') {
    await server.register(import('./presentation/plugins/swagger'))
  }

  // Register routes
  await server.register(import('./presentation/routes'), { prefix: '/api' })

  // Health check
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  return server
}

export async function startServer(): Promise<FastifyInstance> {
  const server = await buildServer()
  
  try {
    const port = config.PORT || 3000
    const host = config.HOST || '0.0.0.0'
    
    await server.listen({ port, host })
    server.log.info(`Server listening on ${host}:${port}`)
    
    return server
  } catch (error) {
    server.log.error(error)
    process.exit(1)
  }
}