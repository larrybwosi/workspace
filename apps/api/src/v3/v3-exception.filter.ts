import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';

@Catch()
export class V3ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('V3ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseObj = exception instanceof HttpException ? exception.getResponse() : 'Internal server error';
    let message = responseObj;
    if (typeof responseObj === 'object' && responseObj !== null && 'message' in responseObj) {
      message = (responseObj as any).message;
    }

    this.logger.error(
      `${request.method} ${request.url} -> ${status} | ${JSON.stringify(message)}`,
      exception instanceof Error ? exception.stack : undefined
    );

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
