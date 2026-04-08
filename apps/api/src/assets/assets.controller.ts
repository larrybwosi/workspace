import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  async getEligibleAssets(@Request() req: any) {
    return this.assetsService.getEligibleAssets(req.user.id);
  }
}
