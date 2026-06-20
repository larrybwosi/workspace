import { Controller, Post, Body, UnauthorizedException, BadRequestException, Logger, Req } from '@nestjs/common';
import { auth } from '../better-auth';
import { prisma } from '@repo/database';

@Controller('auth/android')
export class AndroidAuthController {
  private readonly logger = new Logger(AndroidAuthController.name);

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
        },
      });
      return this.handleAuthResponse(response, 'Failed to create account');
    } catch (error: any) {
      this.handleAuthError(error);
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

  @Post('refresh')
  async refresh(@Req() request: any) {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        throw new UnauthorizedException('Invalid session');
      }

      return this.handleAuthResponse(session, 'Failed to refresh session');
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  private validateSignupInput(body: any) {
    const fields = ['email', 'password', 'name', 'username'];
    if (fields.some((f) => !body[f])) {
      throw new BadRequestException('Email, password, name, and username are required');
    }
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

  private async handleAuthResponse(response: any, errorMessage: string) {
    if (!response || !response.session) {
      throw new BadRequestException(errorMessage);
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: response.user.id }
    });

    return {
      token: response.session.token,
      user: response.user,
      session: response.session,
      memberships
    };
  }

  private validateLoginInput(email: any, password: any) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
  }

  private async performLogin(email: string, password: string) {
    const response = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!response || !response.session) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.handleAuthResponse(response, 'Login failed');
  }

  private handleAuthError(error: any) {
    this.logger.error(`Authentication error: ${error.message}`, error.stack);
    if (error.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new BadRequestException(error.message || 'Authentication failed');
  }
}
