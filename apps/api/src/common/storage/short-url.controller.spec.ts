import { Test, TestingModule } from '@nestjs/testing';
import { ShortUrlController } from './short-url.controller';
import { RustFSStorageProvider } from './providers/rustfs.provider';
import { vi, describe, beforeEach, it, expect, afterEach } from 'vitest';
import { prisma } from '@repo/database';
import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';

// Mock the prisma export
vi.mock('@repo/database', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    prisma: {
      shortUrl: {
        findUnique: vi.fn(),
      },
    },
  };
});

describe('ShortUrlController', () => {
  let controller: ShortUrlController;
  let rustfsProvider: RustFSStorageProvider;
  let mockRedis: any;

  beforeEach(async () => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShortUrlController],
      providers: [
        {
          provide: RustFSStorageProvider,
          useValue: {
            getPresignedUrl: vi.fn(),
            getFileStream: vi.fn(),
          },
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    controller = module.get<ShortUrlController>(ShortUrlController);
    rustfsProvider = module.get<RustFSStorageProvider>(RustFSStorageProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should proxy file from RustFS direct stream if key is present', async () => {
    const mockShortUrl = {
      id: '1',
      code: 'def',
      original: 'https://fallback.url',
      key: 'test-file-key.png',
      mimeType: 'image/png',
    };

    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(mockShortUrl as any);

    const mockStream = Readable.from(['test content']);
    vi.spyOn(rustfsProvider, 'getFileStream').mockResolvedValue({
      stream: mockStream,
      contentLength: 12,
    });

    const mockRes = {
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await controller.redirect('def', mockRes);

    expect(prisma.shortUrl.findUnique).toHaveBeenCalledWith({ where: { code: 'def' } });
    expect(rustfsProvider.getFileStream).toHaveBeenCalledWith('test-file-key.png');
    expect(mockRes.type).toHaveBeenCalledWith('image/png');
    expect(mockRes.header).toHaveBeenCalledWith('Content-Length', '12');
    expect(mockRes.header).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
    expect(mockRes.send).toHaveBeenCalledWith(mockStream);
  });

  it('should fallback to proxying fetch direct URL if key is absent', async () => {
    const mockShortUrl = {
      id: '1',
      code: 'abc',
      original: 'https://fallback.url',
      key: null,
      mimeType: 'image/png',
    };

    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(mockShortUrl as any);

    const mockWebStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('fetched content'));
        controller.close();
      }
    });

    const mockFetchResponse = {
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '50',
      }),
      body: mockWebStream,
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse));

    const mockRes = {
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await controller.redirect('abc', mockRes);

    expect(prisma.shortUrl.findUnique).toHaveBeenCalledWith({ where: { code: 'abc' } });
    expect(mockRes.type).toHaveBeenCalledWith('image/png');
    expect(mockRes.header).toHaveBeenCalledWith('Content-Length', '50');
    expect(mockRes.send).toHaveBeenCalled();
  });

  it('should throw NotFoundException if short URL is not found', async () => {
    vi.mocked(prisma.shortUrl.findUnique).mockResolvedValue(null);

    const mockRes = {
      type: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      send: vi.fn(),
    } as any;

    await expect(controller.redirect('xyz', mockRes)).rejects.toThrow(NotFoundException);
  });
});
