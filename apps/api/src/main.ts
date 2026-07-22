import 'class-validator';
import 'class-transformer';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { validateEnv } from '@repo/shared';
import { auth } from '@repo/auth';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

function renderHomepage(version: string, docsPath: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Skyrme Chat API</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #0b0c0f;
    --card: #14161b;
    --border: #232730;
    --text: #f5f6f7;
    --muted: #9aa0ab;
    --accent: #6366f1;
    --accent-soft: rgba(99, 102, 241, 0.12);
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    height: 100%;
  }
  body {
    background: radial-gradient(circle at 20% -10%, var(--accent-soft), transparent 60%), var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .card {
    width: 100%;
    max-width: 460px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 36px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 6px 10px;
    border-radius: 999px;
    margin-bottom: 20px;
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
  }
  h1 {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  p.lead {
    margin: 0 0 28px;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.5;
  }
  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--muted);
    border-top: 1px solid var(--border);
    padding-top: 16px;
    margin-bottom: 24px;
  }
  .meta strong {
    color: var(--text);
    font-weight: 500;
  }
  a.button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    text-decoration: none;
    background: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 16px;
    border-radius: 10px;
    transition: opacity 0.15s ease;
  }
  a.button:hover {
    opacity: 0.88;
  }
  footer {
    margin-top: 20px;
    text-align: center;
    font-size: 12px;
    color: var(--muted);
  }
</style>
</head>
<body>
  <div class="card">
    <span class="badge"><span class="dot"></span> API online</span>
    <h1>Skyrme Chat API</h1>
    <p class="lead">This is the backend service for Skyrme Chat. There's nothing to see here directly &mdash; head to the docs to explore available endpoints.</p>
    <div class="meta">
      <span>Version</span>
      <strong>${version}</strong>
    </div>
    <a class="button" href="${docsPath}">View API Documentation</a>
    <footer>Powered by Scryme Technologies</footer>
  </div>
</body>
</html>`;
}

// Polyfill for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const env = validateEnv();

  const adapter = new FastifyAdapter({
    bodyLimit: 30 * 1024 * 1024, // 30MB
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter);

  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'set-cookie',
      'cookie',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // Log every incoming request: method, path, status code, and response time
  fastifyInstance.addHook('onRequest', async (request: any) => {
    (request as any)._startTime = Date.now();
  });

  fastifyInstance.addHook('onResponse', async (request: any, reply: any) => {
    const startTime = (request as any)._startTime ?? Date.now();
    const duration = Date.now() - startTime;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${request.method} ${request.url} ${reply.statusCode} - ${duration}ms`);
  });

  await app.register(fastifyCookie as any);
  await app.register(fastifyMultipart as any);
  fastifyInstance.get('/', async (_request: any, reply: any) => {
    reply.type('text/html').send(renderHomepage('2.0', '/api/docs'));
  });

  fastifyInstance.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = fromNodeHeaders(request.headers);
      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((v, k) => reply.header(k, v));
      return reply.send(response.body ? await response.text() : null);
    },
  });

  const redisUrl = env.REDIS_URL;
  if (redisUrl) {
    const { RedisIoAdapter } = await import('./common/realtime/redis-io.adapter');
    const redisIoAdapter = new RedisIoAdapter(app, redisUrl);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  } else {
    app.useWebSocketAdapter(new WsAdapter(app));
  }

  app.setGlobalPrefix('api', {
    exclude: ['s/:code'],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Skyrme Chat API')
    .setDescription(
      'Comprehensive API documentation for Skyrme Chat V2 and V3 Enterprise. This documentation describes both standard V2 integrations and high-performance, secure V3 Enterprise M2M interfaces.'
    )
    .setVersion('3.0')
    .addBearerAuth()
    .addTag('Authentication', 'Bot and integration authentication using OAuth2 client credentials.')
    .addTag('Members', 'Manage workspace members and their roles.')
    .addTag('Channels & Messages', 'Communication via channels and direct messages.')
    .addTag('Threads', 'Manage threaded conversations.')
    .addTag('Teams', 'Workspace team management.')
    .addTag('Departments', 'Organizational structure management.')
    .addTag('Announcements', 'Broadcast messages to departments.')
    .addTag('Webhooks', 'Configure real-time event delivery.')
    .addTag('Search', 'Search for messages and members.')
    .addTag('API Tokens', 'Manage long-lived workspace API tokens.')
    .addTag('Bot Applications', 'Create and manage bot integrations.')
    .addTag('V3 Authentication', 'OAuth token acquisition for Enterprise V3 M2M clients with IP allowlist validation.')
    .addTag('V3 Workspaces', 'Enterprise workspace provisioning and metadata CRUD management with multi-tenant isolation and 10-minute Redis caching.')
    .addTag('V3 Webhooks', 'High-performance Redis-cached workspace outgoing webhooks with automatic cache invalidation.')
    .addTag('V3 Channel Incoming Webhooks', 'Discord-style incoming webhooks targeting channels via secure paths or tokens.')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  if (process.env.EXPORT_OPENAPI === 'true') {
    const fs = await import('fs');
    const path = await import('path');
    const outputPath = path.resolve(process.cwd(), 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
    console.log(`OpenAPI specification exported to ${outputPath}`);
    process.exit(0);
  }

  await app.listen(env.PORT, '0.0.0.0');

  const port = env.PORT;

  console.log('');
  console.log(`  Skyrme Chat API`);
  console.log(`  - Local:        http://localhost:${port}/api`);
  console.log(`  - Docs:         http://localhost:${port}/api/docs`);
  console.log('');
  console.log(' ✓ Server ready');
  console.log('');
}
bootstrap();
