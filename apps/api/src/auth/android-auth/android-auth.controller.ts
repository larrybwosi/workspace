import { Controller, Post, Body, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { auth } from '../better-auth';

@Controller('auth/android')
export class AndroidAuthController {
  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    this.validateLoginInput(email, password);

    try {
      return await this.performLogin(email, password);
    } catch (error: any) {
      this.handleLoginError(error);
    }
  }

  private validateLoginInput(email: any, password: any) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
  }

  private async performLogin(email: string, password: string) {
    // Use better-auth internal API to verify credentials and create a session
    // Since better-auth is primarily cookie-based, we call the sign-in/email endpoint
    // and manually extract the token/session.
    const response = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!response || !response.session) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      token: response.session.token,
      user: response.user,
      session: response.session,
    };
  }

  private handleLoginError(error: any) {
    if (error.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new UnauthorizedException(error.message || 'Authentication failed');
  }
}
