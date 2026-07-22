import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseObj = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    let message = responseObj;
    let errorDetail = undefined;

    if (typeof responseObj === 'object' && responseObj !== null) {
      if ('message' in responseObj) {
        message = (responseObj as any).message;
      }
      if ('error' in responseObj) {
        errorDetail = (responseObj as any).error;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status} | ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined
    );

    const payload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errorDetail ? { error: errorDetail } : {}),
    };

    if (typeof response.status === 'function') {
      response.status(status).send(payload);
    } else {
      response.statusCode = status;
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(payload));
    }
  }
}
