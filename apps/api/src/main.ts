import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { validateEnv } from '@repo/shared';
import multipart from '@fastify/multipart';

// Polyfill for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const env = validateEnv();
  const adapter = new FastifyAdapter({
    bodyLimit: 30 * 1024 * 1024, // 30MB
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { bodyParser: false });

  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];

  app.enableCors({
    credentials: true,
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
  });

  // Better Auth handles its own body parsing for /api/auth
  // We bypass Fastify's default body parser for these routes to avoid consuming the request stream
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addContentTypeParser('application/json', (request, payload, done) => {
    if (request.url.startsWith('/api/auth')) {
      done(null, undefined);
    } else {
      // Use the default JSON parser for other routes
      const chunks: any[] = [];
      payload.on('data', chunk => chunks.push(chunk));
      payload.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          done(null, body);
        } catch (err: any) {
          done(err, undefined);
        }
      });
    }
  });

  fastifyInstance.addContentTypeParser('application/x-www-form-urlencoded', (request, payload, done) => {
    if (request.url.startsWith('/api/auth')) {
      done(null, undefined);
    } else {
      // Use the default parser or simply pass through for now
      // Fastify has built-in support, but manual implementation is needed here to match the bypass logic
      const chunks: any[] = [];
      payload.on('data', chunk => chunks.push(chunk));
      payload.on('end', () => {
        try {
          const body = Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()));
          done(null, body);
        } catch (err: any) {
          done(err, undefined);
        }
      });
    }
  });

  // We need to register multipart support
  await app.register(multipart);

  app.useWebSocketAdapter(new WsAdapter(app));

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('Skyrme Chat API')
    .setDescription('Comprehensive API documentation for Skyrme Chat V2. This documentation is used by developers and for Bot API integration.')
    .setVersion('2.0')
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

  await app.listen(env.PORT);
}
bootstrap();
