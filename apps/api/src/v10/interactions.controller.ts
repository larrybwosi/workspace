import { Controller, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { V10InteractionsService } from './interactions.service';

@Controller('bot/v10/interactions')
export class V10InteractionsController {
  constructor(private readonly interactionsService: V10InteractionsService) {}

  @Post(':id/:token/callback')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleCallback(
    @Param('id') id: string,
    @Param('token') token: string,
    @Body() body: any,
  ) {
    return this.interactionsService.handleCallback(id, token, body);
  }
}
