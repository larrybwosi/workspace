import { Controller, Post, Body } from '@nestjs/common';

@Controller('v2/contact')
export class V2ContactController {
  @Post()
  async submitContactForm(@Body() body: any) {
    // For now, just return success. Later this can send an email.
    console.log('Contact form submitted:', body);
    return { success: true, message: 'Message received' };
  }
}
