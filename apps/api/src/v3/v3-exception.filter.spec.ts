import { V3ExceptionFilter } from './v3-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('V3ExceptionFilter', () => {
  let filter: V3ExceptionFilter;

  beforeEach(() => {
    filter = new V3ExceptionFilter();
  });

  it('should format HttpException cleanly with statusCode, timestamp, path, and message', () => {
    const mockStatus = HttpStatus.FORBIDDEN;
    const mockMessage = 'Access denied';
    const exception = new HttpException(mockMessage, mockStatus);

    const mockResponseSend = vi.fn();
    const mockResponseStatus = vi.fn().mockReturnValue({ send: mockResponseSend });
    const mockRequestUrl = '/api/v3/workspaces/acme';

    const mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({
          status: mockResponseStatus,
        }),
        getRequest: vi.fn().mockReturnValue({
          url: mockRequestUrl,
          method: 'GET',
        }),
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(mockResponseStatus).toHaveBeenCalledWith(mockStatus);
    expect(mockResponseSend).toHaveBeenCalled();
    const sentData = mockResponseSend.mock.calls[0][0];
    expect(sentData.statusCode).toBe(mockStatus);
    expect(sentData.message).toBe(mockMessage);
    expect(sentData.path).toBe(mockRequestUrl);
    expect(sentData.timestamp).toBeDefined();
  });

  it('should unpack NestJS complex validation error objects', () => {
    const mockStatus = HttpStatus.BAD_REQUEST;
    const mockValidationMessages = ['email must be an email', 'slug must not be empty'];
    const exception = new HttpException(
      {
        statusCode: 400,
        message: mockValidationMessages,
        error: 'Bad Request',
      },
      mockStatus
    );

    const mockResponseSend = vi.fn();
    const mockResponseStatus = vi.fn().mockReturnValue({ send: mockResponseSend });
    const mockRequestUrl = '/api/v3/workspaces';

    const mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({
          status: mockResponseStatus,
        }),
        getRequest: vi.fn().mockReturnValue({
          url: mockRequestUrl,
          method: 'POST',
        }),
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(mockResponseStatus).toHaveBeenCalledWith(mockStatus);
    const sentData = mockResponseSend.mock.calls[0][0];
    expect(sentData.statusCode).toBe(mockStatus);
    expect(sentData.message).toEqual(mockValidationMessages);
    expect(sentData.path).toBe(mockRequestUrl);
  });

  it('should default non-HttpExceptions to 500 Internal Server Error', () => {
    const exception = new Error('Database connection failed');

    const mockResponseSend = vi.fn();
    const mockResponseStatus = vi.fn().mockReturnValue({ send: mockResponseSend });
    const mockRequestUrl = '/api/v3/workspaces';

    const mockHost = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue({
          status: mockResponseStatus,
        }),
        getRequest: vi.fn().mockReturnValue({
          url: mockRequestUrl,
          method: 'POST',
        }),
      }),
    };

    filter.catch(exception, mockHost as any);

    expect(mockResponseStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const sentData = mockResponseSend.mock.calls[0][0];
    expect(sentData.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(sentData.message).toBe('Internal server error');
    expect(sentData.path).toBe(mockRequestUrl);
  });
});
