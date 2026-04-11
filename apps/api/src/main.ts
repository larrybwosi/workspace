import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { validateEnv } from '@repo/shared';

async function bootstrap() {
  const env = validateEnv();
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/auth')) {
      return next();
    }
    json({ limit: '30mb' })(req, res, next);
  });
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/auth')) {
      return next();
    }
    urlencoded({ limit: '30mb', extended: true })(req, res, next);
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || [];

  app.enableCors({
    credentials: true,
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Dealio API')
    .setDescription('Enterprise Backend for Dealio')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT);
}
bootstrap();
