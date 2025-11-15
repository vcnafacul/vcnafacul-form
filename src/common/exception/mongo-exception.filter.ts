/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { MongoServerError } from 'mongodb';

export class MongoExceptionFilter implements ExceptionFilter {
  catch(error: MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();

    //Duplicate key
    if (error.code === 11000) {
      // Tenta extrair o(s) campo(s) únicos
      const fields = Object.keys((error as any).keyPattern ?? (error as any).keyValue ?? {});
      const fieldList = fields.length ? fields.join(', ') : 'unique field';

      return res.status(409).json({
        statusCode: 409,
        error: 'Conflict',
        message: `Duplicate value for ${fieldList}.`,
        details: {
          keyPattern: (error as any).keyPattern,
          keyValue: (error as any).keyValue,
        },
      });
    }

    const message = error?.response?.message;
    if (typeof message === 'string') {
      return res.status(error.status).json({
        statusCode: error.status,
        error: message,
        message,
      });
    }

    return res.status(error.status ?? 500).json({
      statusCode: error?.status ?? 500,
      error: error?.response?.message?.map((m) => m).join(', ') ?? error.message,
      message: error.message,
    });
  }
}
