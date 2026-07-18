import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { DeviceAuthController } from './device-auth.controller';

// Mock Better-Auth API methods
const { mockDeviceCode, mockDeviceToken, mockDeviceApprove, mockDeviceDeny } = vi.hoisted(() => ({
  mockDeviceCode: vi.fn(),
  mockDeviceToken: vi.fn(),
  mockDeviceApprove: vi.fn(),
  mockDeviceDeny: vi.fn(),
}));

vi.mock('@repo/auth', () => ({
  auth: {
    api: {
      deviceCode: mockDeviceCode,
      deviceToken: mockDeviceToken,
      deviceApprove: mockDeviceApprove,
      deviceDeny: mockDeviceDeny,
    },
  },
}));

// Mock @repo/shared/server
const { mockPublishRealtime } = vi.hoisted(() => ({
  mockPublishRealtime: vi.fn(),
}));

vi.mock('@repo/shared/server', () => ({
  publishRealtime: mockPublishRealtime,
}));

describe('DeviceAuthController', () => {
  let controller: DeviceAuthController;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceAuthController],
    }).compile();

    controller = module.get<DeviceAuthController>(DeviceAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // generateQR
  // ─────────────────────────────────────────────────────────────────────────────
  describe('generateQR', () => {
    it('should return device auth details from Better-Auth', async () => {
      mockDeviceCode.mockResolvedValue({
        device_code: 'mock-dev-code',
        user_code: 'mock-user-code',
        verification_uri: 'http://localhost/device',
        verification_uri_complete: 'http://localhost/device?user_code=mock-user-code',
        expires_in: 120,
        interval: 5,
      });

      const result = await controller.generateQR();

      expect(mockDeviceCode).toHaveBeenCalledWith({
        body: { client_id: 'desktop-app' },
      });
      expect(result).toEqual({
        deviceCode: 'mock-dev-code',
        userCode: 'mock-user-code',
        verificationUri: 'http://localhost/device',
        verificationUriComplete: 'http://localhost/device?user_code=mock-user-code',
        expiresIn: 120,
        interval: 5,
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // checkStatus
  // ─────────────────────────────────────────────────────────────────────────────
  describe('checkStatus', () => {
    it("should return status 'authorized' with token when access_token is present", async () => {
      mockDeviceToken.mockResolvedValue({
        access_token: 'mock-access-token',
      });

      const result = await controller.checkStatus('my-device-code');

      expect(mockDeviceToken).toHaveBeenCalledWith({
        body: {
          grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
          device_code: 'my-device-code',
          client_id: 'desktop-app',
        },
      });
      expect(result).toEqual({ status: 'authorized', token: 'mock-access-token' });
    });

    it("should return status 'pending' when access_token is not returned", async () => {
      mockDeviceToken.mockResolvedValue(null);

      const result = await controller.checkStatus('my-device-code');
      expect(result).toEqual({ status: 'pending' });
    });

    it("should return status 'pending' on authorization_pending error", async () => {
      mockDeviceToken.mockRejectedValue({
        error: 'authorization_pending',
      });

      const result = await controller.checkStatus('my-device-code');
      expect(result).toEqual({ status: 'pending' });
    });

    it("should return status 'pending' with slowDown: true on slow_down error", async () => {
      mockDeviceToken.mockRejectedValue({
        error: 'slow_down',
      });

      const result = await controller.checkStatus('my-device-code');
      expect(result).toEqual({ status: 'pending', slowDown: true });
    });

    it("should return status 'denied' on access_denied error", async () => {
      mockDeviceToken.mockRejectedValue({
        error: 'access_denied',
      });

      const result = await controller.checkStatus('my-device-code');
      expect(result).toEqual({ status: 'denied' });
    });

    it("should return status 'expired' on expired_token error", async () => {
      mockDeviceToken.mockRejectedValue({
        error: 'expired_token',
      });

      const result = await controller.checkStatus('my-device-code');
      expect(result).toEqual({ status: 'expired' });
    });

    it('should throw BadRequestException on unknown errors', async () => {
      mockDeviceToken.mockRejectedValue({
        error: 'invalid_client',
        body: { error_description: 'Client is invalid' },
      });

      await expect(controller.checkStatus('my-device-code')).rejects.toThrow(BadRequestException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // authorize
  // ─────────────────────────────────────────────────────────────────────────────
  describe('authorize', () => {
    const mockRequest = {
      headers: { host: 'localhost' },
    } as any;

    it('should throw BadRequestException when userCode is missing', async () => {
      await expect(controller.authorize({ userCode: '' }, mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should call deviceApprove and publishRealtime on success', async () => {
      mockDeviceApprove.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.authorize({ userCode: 'ABCD-1234' }, mockRequest);

      expect(mockDeviceApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'ABCD-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:ABCD-1234',
        'authorized',
        { status: 'authorized' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should fallback to sessionId if userCode is missing in the body', async () => {
      mockDeviceApprove.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.authorize({ sessionId: 'SESS-1234' }, mockRequest);

      expect(mockDeviceApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'SESS-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:SESS-1234',
        'authorized',
        { status: 'authorized' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should parse userCode from standard URL query parameters', async () => {
      mockDeviceApprove.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.authorize(
        { userCode: 'https://example.com/device?user_code=QUERY-1234' },
        mockRequest
      );

      expect(mockDeviceApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'QUERY-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:QUERY-1234',
        'authorized',
        { status: 'authorized' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should parse userCode from URL trailing pathname segment', async () => {
      mockDeviceApprove.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.authorize(
        { userCode: 'https://example.com/device/PATH-1234' },
        mockRequest
      );

      expect(mockDeviceApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'PATH-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:PATH-1234',
        'authorized',
        { status: 'authorized' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException on 404 or invalid_grant', async () => {
      mockDeviceApprove.mockRejectedValue({
        status: 404,
      });

      await expect(controller.authorize({ userCode: 'ABCD-1234' }, mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException on 403 or access_denied', async () => {
      mockDeviceApprove.mockRejectedValue({
        status: 403,
      });

      await expect(controller.authorize({ userCode: 'ABCD-1234' }, mockRequest)).rejects.toThrow(ForbiddenException);
    });

    it('should throw InternalServerErrorException on other errors', async () => {
      mockDeviceApprove.mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.authorize({ userCode: 'ABCD-1234' }, mockRequest)).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // deny
  // ─────────────────────────────────────────────────────────────────────────────
  describe('deny', () => {
    const mockRequest = {
      headers: { host: 'localhost' },
    } as any;

    it('should throw BadRequestException when userCode is missing', async () => {
      await expect(controller.deny({ userCode: '' }, mockRequest)).rejects.toThrow(BadRequestException);
    });

    it('should call deviceDeny and publishRealtime on success', async () => {
      mockDeviceDeny.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.deny({ userCode: 'ABCD-1234' }, mockRequest);

      expect(mockDeviceDeny).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'ABCD-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:ABCD-1234',
        'denied',
        { status: 'denied' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should fallback to sessionId and parse URL in deny endpoint', async () => {
      mockDeviceDeny.mockResolvedValue(undefined);
      mockPublishRealtime.mockResolvedValue(undefined);

      const result = await controller.deny(
        { sessionId: 'http://localhost/device?user_code=DENY-1234' },
        mockRequest
      );

      expect(mockDeviceDeny).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { userCode: 'DENY-1234' },
        })
      );
      expect(mockPublishRealtime).toHaveBeenCalledWith(
        'qr-session:DENY-1234',
        'denied',
        { status: 'denied' }
      );
      expect(result).toEqual({ success: true });
    });

    it('should throw BadRequestException on errors during deny', async () => {
      mockDeviceDeny.mockRejectedValue(new Error('Not found'));

      await expect(controller.deny({ userCode: 'ABCD-1234' }, mockRequest)).rejects.toThrow(BadRequestException);
    });
  });
});
