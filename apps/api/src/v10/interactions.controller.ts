import { Controller, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { V10InteractionsService } from './interactions.service';

@Controller('bot/v10/interactions')
export class V10InteractionsController {
  constructor(private readonly interactionsService: V10InteractionsService) {}

  @AllowAnonymous()
  @Post(':id/:token/callback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleCallback(@Param('id') id: string, @Param('token') token: string, @Body() body: any) {
    return this.interactionsService.handleCallback(id, token, body);
  }
}
