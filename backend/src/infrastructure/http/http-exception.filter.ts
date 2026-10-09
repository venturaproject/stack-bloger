import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(Error)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error & { statusCode?: number }, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : (exception.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception.message, exception.stack);
    }

    if (isHttpException) {
      const exceptionResponse = exception.getResponse();

      if (status === HttpStatus.UNPROCESSABLE_ENTITY && typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        response.status(status).json(exceptionResponse);
        return;
      }

      response.status(status).json(
        typeof exceptionResponse === 'string'
          ? { statusCode: status, message: exceptionResponse, error: exception.name }
          : exceptionResponse,
      );
      return;
    }

    response.status(status).json({
      statusCode: status,
      message: status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal server error' : exception.message,
      error: status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'Internal Server Error' : exception.name,
    });
  }
}
