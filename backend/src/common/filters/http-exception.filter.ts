import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erreur interne du serveur';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse() as any;
      if (typeof resp === 'string') {
        message = resp;
      } else if (resp?.message) {
        message = resp.message;
      }
      if (resp?.error) error = resp.error;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    this.logger.error(`${request.method} ${request.url} → ${status} : ${message}`);

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
