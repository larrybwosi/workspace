import { NestFactory } from '@nestjs/core';
import { McpModule } from './integrations/mcp/mcp.module';
import { McpService } from './integrations/mcp/mcp.service';

async function bootstrap() {
  // Use a minimal app with only the McpModule
  const app = await NestFactory.createApplicationContext(McpModule, {
    logger: ['error', 'warn'], // Minimize noise on stdout/stderr
  });

  const mcpService = app.get(McpService);
  await mcpService.run();

  // Handle process termination
  process.on('SIGINT', async () => {
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await app.close();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
