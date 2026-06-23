import { Controller, Post, Get, Query, Body, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { auth } from '../better-auth';
import { prisma } from '@repo/database';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller('android-auth')
@AllowAnonymous()
export class AndroidAuthController {
  private readonly logger = new Logger(AndroidAuthController.name);

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    this.validateUsername(username);

    try {
      const user = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      return { available: !user };
    } catch (error: any) {
      this.handleAuthError(error, 'Failed to check username availability');
    }
  }

  private validateUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, and underscores');
    }
  }

  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    this.validateLoginInput(email, password);

    try {
      return await this.performLogin(email, password);
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  @Post('signup')
  async signup(@Body() body: any) {
    this.validateSignupInput(body);
    try {
      const response = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password,
          name: body.name,
          username: body.username,
          image: body.avatar || body.image,
          bio: body.bio,
        } as any,
      });
      return this.handleAuthResponse(response, 'Failed to create account');
    } catch (error: any) {
      this.handleAuthError(error, 'Signup failed');
    }
  }

  @Post('social/google')
  async googleLogin(@Body() body: any) {
    if (!body.idToken) {
      throw new BadRequestException('Google idToken is required');
    }
    return this.performSocialLogin('google', { idToken: body.idToken });
  }

  @Post('social/github')
  async githubLogin(@Body() body: any) {
    if (!body.code) {
      throw new BadRequestException('GitHub authorization code is required');
    }
    return this.performSocialLogin('github', { code: body.code });
  }

  private validateSignupInput(body: any) {
    const fields = ['email', 'password', 'name', 'username'];
    if (fields.some(f => !body[f])) {
      throw new BadRequestException('Email, password, name, and username are required');
    }

    if (body.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    this.validateUsername(body.username);
  }

  private async performSocialLogin(provider: string, data: any) {
    try {
      const response = await auth.api.signInSocial({
        body: { provider, ...data },
      });
      return this.handleAuthResponse(response, `${provider} authentication failed`);
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  private handleAuthResponse(response: any, errorMessage: string) {
    if (!response || !response.session) {
      throw new BadRequestException(errorMessage);
    }

    // Better-Auth uses 'image' but we also want to provide 'avatar' for compatibility
    const user = {
      ...response.user,
      avatar: response.user.image,
    };

    return {
      token: response.session.token,
      user,
      session: response.session,
    };
  }

  private validateLoginInput(email: any, password: any) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
  }

  private async performLogin(email: string, password: string) {
    const response = (await auth.api.signInEmail({
      body: { email, password },
    })) as any;

    if (!response || !response.session) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.handleAuthResponse(response, 'Invalid credentials');
  }

  private handleAuthError(error: any, defaultMessage = 'Authentication failed') {
    this.logger.error(`${defaultMessage}: ${error.message}`, error.stack);
    if (error.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new BadRequestException(error.message || defaultMessage);
  }
}
