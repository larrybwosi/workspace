import { Controller, Post, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../../auth/auth.guard';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(@Req() req: FastifyRequest) {
    const data = await req.file();
    if (!data) {
      throw new BadRequestException('No file uploaded');
    }

    // Threat Mitigation (CWE-434 / CWE-400): Disallow dangerous MIME types that could lead to
    // stored XSS (e.g. text/html, image/svg+xml) or remote code execution, and enforce strict payload size limits.
    const DISALLOWED_MIME_TYPES = [
      'text/html',
      'image/svg+xml',
      'application/x-msdownload',
      'application/x-sh',
      'application/x-executable',
      'application/x-dsh',
      'application/x-bat',
      'application/javascript',
      'text/javascript',
    ];

    const normalizedMimeType = (data.mimetype || '').toLowerCase().trim();
    if (DISALLOWED_MIME_TYPES.includes(normalizedMimeType)) {
      throw new BadRequestException(`File upload rejected: MIME type '${data.mimetype}' is not permitted.`);
    }

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    const buffer = await data.toBuffer();
    if (buffer.length > MAX_FILE_SIZE) {
      throw new BadRequestException('File upload rejected: Exceeds maximum allowed size of 25MB.');
    }

    const file = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
      size: buffer.length,
    };
    return this.storageService.uploadFile(file);
  }
}
