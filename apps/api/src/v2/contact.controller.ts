import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('General')
@Controller('v2/contact')
export class V2ContactController {
  @Post()
  @ApiOperation({ summary: 'Submit a contact form' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Form submitted successfully.' })
  async submitContactForm(@Body() body: any) {
    // For now, just return success. Later this can send an email.
    console.log('Contact form submitted:', body);
    return { success: true, message: 'Message received' };
  }
}
