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

  @Post('change-password')
  async changePassword(@Session() session: UserSession, @Body() body: any) {
    const { newPassword, currentPassword } = body;
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    try {
      // @ts-ignore - Better Auth types can be tricky in some environments
      await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        },
        headers: {
          authorization: `Bearer ${session.session.token}`,
        },
      });
      return { success: true };
    } catch (error: any) {
      this.handleAuthError(error, 'Failed to change password');
    }
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
      const signUpResponse = await auth.api.signUpEmail({
        body: {
          email: body.email,
          password: body.password,
          name: body.name,
          username: body.username,
          image: body.avatar || body.image,
          bio: body.bio,
        } as any,
      });

      if (!signUpResponse || !signUpResponse.user) {
        throw new BadRequestException('Failed to create account');
      }

      // Automatically log the user in after a successful signup to generate
      // the required session token and retrieve standard LoginResponse properties.
      return await this.performLogin(body.email, body.password);
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

  @Post('refresh')
  @AllowAnonymous()
  async refresh(@Body() body: any) {
    const { token } = body;
    if (!token) {
      throw new BadRequestException('Token is required for refresh');
    }

    try {
      // Use getSession to verify the current token and return fresh session data
      let response = await auth.api.getSession({
        headers: {
          authorization: `Bearer ${token}`,
          cookie: `better-auth.session_token=${token}`,
        },
      });

      // Fallback for refresh if API fails
      if (!response) {
        this.logger.log(`Refresh API call failed, trying direct DB lookup for token`);
        const dbSession = await prisma.session.findUnique({
          where: { token },
          include: { user: true },
        });

        if (dbSession && dbSession.expiresAt > new Date()) {
          response = {
            session: dbSession,
            user: dbSession.user,
          } as any;
        }
      }

      if (!response) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      return await this.handleAuthResponse(
        {
          token,
          user: response.user,
          session: response.session,
        },
        'Failed to refresh session',
        token
      );
    } catch (error: any) {
      this.handleAuthError(error, 'Refresh failed');
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
      return await this.handleAuthResponse(response, `${provider} authentication failed`);
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  private async handleAuthResponse(response: any, errorMessage: string, fallbackToken?: string) {
    if (!response || !response.user) {
      throw new BadRequestException(errorMessage);
    }

    const user = {
      ...response.user,
      avatar: response.user?.image || null,
    };

    let session = response.session;
    let token = response.token || response.session?.token || fallbackToken;

    // If session is missing but we have a token, try to fetch it
    if (!session && token) {
      try {
        const sessionData = await auth.api.getSession({
          headers: {
            authorization: `Bearer ${token}`,
            cookie: `better-auth.session_token=${token}`,
          },
        });
        session = sessionData?.session;
      } catch (e: any) {
        this.logger.warn(`Better Auth API failed to fetch session: ${e.message}`);
      }

      // Solid fallback: Direct database query if API fails
      if (!session) {
        this.logger.log(`Falling back to direct DB query for session with token`);
        session = await prisma.session.findUnique({
          where: { token },
        });
      }
    }

    // Fallback: If no token/session yet but we have user, try to find latest session for user
    if (!session && !token && response.user?.id) {
      this.logger.log(`No token or session in response, searching for latest session for user ${response.user.id}`);
      session = await prisma.session.findFirst({
        where: { userId: response.user.id },
        orderBy: { createdAt: 'desc' },
      });
      token = session?.token;
    }

    if (!session && !token) {
      throw new BadRequestException(errorMessage);
    }

    // Fetch user memberships to return to the Android app
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
    });

    // Convert BigInt permissions to Number for Android compatibility
    const serializedMemberships = memberships.map(m => ({
      ...m,
      permissions: Number(m.permissions),
    }));
    console.log(session);

    return {
      token: token || session?.token,
      user,
      session: session
        ? {
            ...session,
            token: session.token || token || fallbackToken, // Ensure token is present in session object
          }
        : null,
      memberships: serializedMemberships,
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

    if (!response || (!response.token && !response.session && !response.user)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return await this.handleAuthResponse(response, 'Invalid credentials');
  }

  private handleAuthError(error: any, defaultMessage = 'Authentication failed') {
    this.logger.error(`${defaultMessage}: ${error.message}`, error.stack);
    if (error.status === 401) {
      throw new UnauthorizedException('Invalid credentials');
    }
    throw new BadRequestException(error.message || defaultMessage);
  }
}
