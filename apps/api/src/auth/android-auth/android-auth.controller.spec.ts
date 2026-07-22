import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AndroidAuthController } from './android-auth.controller';
import { auth } from '@repo/auth';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// Mock @repo/auth
vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
      signUpEmail: vi.fn(),
      signInSocial: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

// Mock @repo/database
vi.mock('@repo/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    workspaceMember: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    session: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

describe('AndroidAuthController', () => {
  let controller: AndroidAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AndroidAuthController],
    }).compile();

    controller = module.get<AndroidAuthController>(AndroidAuthController);
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should fetch session if it is missing from the initial response', async () => {
      const mockToken = 'mock-token';
      const mockUser = { id: 'user-1', email: 'test@example.com', image: 'avatar.png' };
      const mockSession = { id: 'session-1', token: mockToken, expiresAt: new Date().toISOString() };

      // Mock signInEmail to return only token and user
      (auth.api.signInEmail as any).mockResolvedValue({
        token: mockToken,
        user: mockUser,
      });

      // Mock getSession to return the full session
      (auth.api.getSession as any).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.login({ email: 'test@example.com', password: 'password' });

      expect(auth.api.signInEmail).toHaveBeenCalled();
      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: {
          authorization: `Bearer ${mockToken}`,
          cookie: `better-auth.session_token=${mockToken}`,
        },
      });

      expect(result).toEqual({
        token: mockToken,
        user: {
          ...mockUser,
          avatar: 'avatar.png',
        },
        session: mockSession,
        memberships: [],
      });
    });

    it('should NOT fetch session if it is already present in the initial response', async () => {
      const mockToken = 'mock-token';
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockSession = { id: 'session-1', token: mockToken };

      (auth.api.signInEmail as any).mockResolvedValue({
        token: mockToken,
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.login({ email: 'test@example.com', password: 'password' });

      expect(auth.api.signInEmail).toHaveBeenCalled();
      expect(auth.api.getSession).not.toHaveBeenCalled();

      expect(result.session).toEqual(mockSession);
      expect(result.memberships).toEqual([]);
    });

    it('should throw UnauthorizedException if login fails', async () => {
      (auth.api.signInEmail as any).mockResolvedValue(null);

      await expect(controller.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signup', () => {
    it('should handle signup and automatically log the user in', async () => {
      const mockToken = 'signup-token';
      const mockUser = { id: 'user-2', email: 'new@example.com', name: 'New User' };
      const mockSession = { id: 'session-2', token: mockToken };

      (auth.api.signUpEmail as any).mockResolvedValue({
        user: mockUser,
      });

      (auth.api.signInEmail as any).mockResolvedValue({
        token: mockToken,
        user: mockUser,
        session: mockSession,
      });

      const signupData = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        username: 'newuser',
      };

      const result = await controller.signup(signupData);

      expect(auth.api.signUpEmail).toHaveBeenCalled();
      expect(auth.api.signInEmail).toHaveBeenCalledWith({
        body: {
          email: signupData.email,
          password: signupData.password,
        },
      });
      expect(result.session).toEqual(mockSession);
      expect(result.token).toBe(mockToken);
      expect(result.memberships).toEqual([]);
    });
  });

  describe('refresh', () => {
    it('should refresh session with valid token', async () => {
      const mockToken = 'valid-token';
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockSession = { id: 'session-1', token: mockToken, expiresAt: new Date().toISOString() };

      (auth.api.getSession as any).mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.refresh({ token: mockToken });

      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: {
          authorization: `Bearer ${mockToken}`,
          cookie: `better-auth.session_token=${mockToken}`,
        },
      });

      expect(result.token).toBe(mockToken);
      expect(result.session).toEqual(mockSession);
      expect(result.memberships).toEqual([]);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      await expect(controller.refresh({ token: 'invalid-token' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
