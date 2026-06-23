import { Controller, Post, Get, Query, Body, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { auth } from '@repo/auth';
import { prisma } from '@repo/database';
import { AllowAnonymous, Session, UserSession, OptionalAuth } from '@thallesp/nestjs-better-auth';

@Controller('android-auth')
export class AndroidAuthController {
  private readonly logger = new Logger(AndroidAuthController.name);

  /**
   * Protected route to retrieve the current user session.
   * Automatically guarded by nestjs-better-auth's global guard.
   */
  @Get('me')
  async getProfile(@Session() session: UserSession) {
    // No manual 'if (!session)' check needed here!
    // The global AuthGuard handles blocking unauthenticated requests for you.
    return {
      user: {
        ...session.user,
        avatar: session.user.image, // Maintaining avatar mapping for compatibility
      },
      session: session.session,
    };
  }

  @Get('check-username')
  @AllowAnonymous()
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

  @Post('login')
  @AllowAnonymous()
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
  @AllowAnonymous()
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
  @AllowAnonymous()
  async googleLogin(@Body() body: any) {
    if (!body.idToken) {
      throw new BadRequestException('Google idToken is required');
    }
    return this.performSocialLogin('google', { idToken: body.idToken });
  }

  @Post('social/github')
  @AllowAnonymous()
  async githubLogin(@Body() body: any) {
    if (!body.code) {
      throw new BadRequestException('GitHub authorization code is required');
    }
    return this.performSocialLogin('github', { code: body.code });
  }

  private validateUsername(username: string) {
    if (!username || username.length < 3) {
      throw new BadRequestException('Username must be at least 3 characters long');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, and underscores');
    }
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
    // Check for either response.token OR response.session to verify success
    if (!response || (!response.token && !response.session)) {
      throw new BadRequestException(errorMessage);
    }

    const user = {
      ...response.user,
      avatar: response.user?.image || null,
    };

    return {
      // Fallback gracefully depending on where the token is located
      token: response.token || response.session?.token,
      user,
      session: response.session || null,
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

    console.log(response);

    if (!response || !response.token) {
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
