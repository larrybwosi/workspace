import { Controller, Post, Get, UseGuards, Req, Param, Res, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthGuard } from '../../auth/auth.guard';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

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
    const buffer = await data.toBuffer();
    const file = {
      buffer,
      originalname: data.filename,
      mimetype: data.mimetype,
      size: buffer.length,
    };
    return this.storageService.uploadFile(file);
  }

  @Get('files/:filename')
  @ApiOperation({ summary: 'Get a file from local storage' })
  async getFile(@Param('filename') filename: string, @Res() res: FastifyReply) {
    const uploadDir = process.env.RUSTFS_UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    // Prevent directory traversal by using path.basename
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stream = fs.createReadStream(filePath);
    return res.send(stream);
  }
}
