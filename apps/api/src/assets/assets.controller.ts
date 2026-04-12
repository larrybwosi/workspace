import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { AuthGuard } from '../auth/auth.guard';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@Controller('assets')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get('eligible')
  @ApiOperation({ summary: 'Get all eligible assets for the current user' })
  async getEligibleAssets(@Req() req: FastifyRequest & { user: any }) {
    return this.assetsService.getEligibleAssets(req.user.id);
  }
}
