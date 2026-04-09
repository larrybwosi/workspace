import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { SanityService } from '../src/common/sanity/sanity.service';
import { json, urlencoded } from 'express';

describe('Sanity (e2e)', () => {
  let app: INestApplication;
  let sanityService: SanityService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(json({ limit: '30mb' }));
    app.use(urlencoded({ limit: '30mb', extended: true }));
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    sanityService = app.get<SanityService>(SanityService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SanityService File Upload Limits', () => {
    it('should allow file uploads under 30MB', async () => {
      const smallBuffer = Buffer.alloc(1024 * 1024); // 1MB
      const file = {
        buffer: smallBuffer,
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: smallBuffer.length,
      };

      const result = await sanityService.uploadFile(file);
      expect(result).toBeDefined();
      expect(result.name).toBe('test.txt');
    });

    it('should reject file uploads over 30MB', async () => {
      const largeBuffer = Buffer.alloc(31 * 1024 * 1024); // 31MB
      const file = {
        buffer: largeBuffer,
        originalname: 'large.zip',
        mimetype: 'application/zip',
        size: largeBuffer.length,
      };

      await expect(sanityService.uploadFile(file)).rejects.toThrow(
        'File too large. Maximum size is 30MB.'
      );
    });
  });
});
