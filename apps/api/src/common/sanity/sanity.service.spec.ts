import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SanityService } from './sanity.service';

describe('SanityService (Unit)', () => {
  let sanityService: SanityService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SanityService],
    }).compile();

    sanityService = module.get<SanityService>(SanityService);
  });

  describe('uploadFile size limit', () => {
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
