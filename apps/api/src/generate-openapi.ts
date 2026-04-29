import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  // Mock environment variables if needed
  process.env.PORT = '3001';
  process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

  const adapter = new FastifyAdapter();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, { logger: ['error', 'warn'] });

  app.setGlobalPrefix('api');

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
  const outputPath = path.resolve(process.cwd(), 'openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`OpenAPI specification generated at ${outputPath}`);
  // Force exit as some providers might keep the process alive
  process.exit(0);
}

generate().catch(err => {
  console.error('Failed to generate OpenAPI spec:', err);
  process.exit(1);
});
