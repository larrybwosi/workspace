import { Controller, Post, Body, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { auth } from '../better-auth';

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
    const { email, password, name, username } = body;
    if (!email || !password || !name || !username) {
      throw new BadRequestException('Email, password, name, and username are required');
    }

    try {
      const response = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          username,
        },
      });

      if (!response || !response.session) {
        throw new BadRequestException('Failed to create account');
      }

      return {
        token: response.session.token,
        user: response.user,
        session: response.session,
      };
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  @Post('social/google')
  async googleLogin(@Body() body: any) {
    const { idToken } = body;
    if (!idToken) {
      throw new BadRequestException('Google idToken is required');
    }

    try {
      // For Google login via ID Token, we use the signInSocial internal API
      // Better-Auth handles the verification of the token
      const response = await auth.api.signInSocial({
        body: {
          provider: 'google',
          idToken,
        },
      });

      if (!response || !response.session) {
        throw new UnauthorizedException('Google authentication failed');
      }

      return {
        token: response.session.token,
        user: response.user,
        session: response.session,
      };
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  @Post('social/github')
  async githubLogin(@Body() body: any) {
    const { code } = body;
    if (!code) {
      throw new BadRequestException('GitHub authorization code is required');
    }

    try {
      // For GitHub, we usually get a code from the web flow
      const response = await auth.api.signInSocial({
        body: {
          provider: 'github',
          code,
        },
      });

      if (!response || !response.session) {
        throw new UnauthorizedException('GitHub authentication failed');
      }

      return {
        token: response.session.token,
        user: response.user,
        session: response.session,
      };
    } catch (error: any) {
      this.handleAuthError(error);
    }
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

    return {
      token: response.session.token,
      user: response.user,
      session: response.session,
    };
  }

  private handleAuthError(error: any) {
    this.logger.error(`Authentication error: ${error.message}`, error.stack);
    if (error.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new BadRequestException(error.message || 'Authentication failed');
  }
}
