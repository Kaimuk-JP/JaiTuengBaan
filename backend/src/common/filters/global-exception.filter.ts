import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

interface ErrorResponse {
    statusCode: number;
    message: string | string[];
    error: string;
    timestamp: string;
    path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let statusCode: number;
        let message: string | string[];
        let error: string;

        if (exception instanceof HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
                error = exception.name;
            } else if (typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as Record<string, any>;
                message = responseObj.message || exception.message;
                error = responseObj.error || exception.name;
            } else {
                message = exception.message;
                error = exception.name;
            }
        } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            const prismaError = this.handlePrismaError(exception);
            statusCode = prismaError.statusCode;
            message = prismaError.message;
            error = prismaError.error;

            this.logger.error(
                `Prisma Error [${exception.code}]: ${exception.message}`,
                exception.stack,
            );
        } else if (exception instanceof Prisma.PrismaClientValidationError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบข้อมูลอีกครั้ง';
            error = 'Validation Error';

            this.logger.error(
                `Prisma Validation Error: ${exception.message}`,
                exception.stack,
            );
        } else if (exception instanceof Prisma.PrismaClientInitializationError) {
            statusCode = HttpStatus.SERVICE_UNAVAILABLE;
            message = 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
            error = 'Database Connection Error';

            this.logger.error(
                `Prisma Initialization Error: ${exception.message}`,
                exception.stack,
            );
        } else if (exception instanceof Prisma.PrismaClientRustPanicError) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'เกิดข้อผิดพลาดร้ายแรงในระบบฐานข้อมูล';
            error = 'Database Critical Error';

            this.logger.error(
                `Prisma Rust Panic: ${exception.message}`,
                exception.stack,
            );
        } else if (exception instanceof TokenExpiredError) {
            statusCode = HttpStatus.UNAUTHORIZED;
            message = 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่';
            error = 'Token Expired';

            this.logger.warn(`Token Expired: ${exception.message}`);
        } else if (exception instanceof JsonWebTokenError) {
            statusCode = HttpStatus.UNAUTHORIZED;
            message = 'Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่';
            error = 'Invalid Token';

            this.logger.warn(`JWT Error: ${exception.message}`);
        } else if (exception instanceof SyntaxError) {
            statusCode = HttpStatus.BAD_REQUEST;
            message = 'รูปแบบข้อมูลไม่ถูกต้อง (JSON ไม่ถูกต้อง)';
            error = 'Bad Request';

            this.logger.warn(`Syntax Error: ${exception.message}`);
        } else if (exception instanceof TypeError) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'เกิดข้อผิดพลาดภายในระบบ';
            error = 'Internal Server Error';

            this.logger.error(
                `Type Error: ${exception.message}`,
                exception.stack,
            );
        } else if (exception instanceof Error) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง';
            error = 'Internal Server Error';

            this.logger.error(
                `Unexpected error: ${exception.message}`,
                exception.stack,
            );
        } else {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
            error = 'Unknown Error';

            this.logger.error('Unknown exception:', exception);
        }

        const errorResponse: ErrorResponse = {
            statusCode,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        if (!this.isNoiseRequest(request, statusCode)) {
            this.logger.warn(
                `${request.method} ${request.url} - ${statusCode} - ${JSON.stringify(message)}`,
            );
        }

        response.status(statusCode).json(errorResponse);
    }

    private isNoiseRequest(request: Request, statusCode: number): boolean {
        if (statusCode !== HttpStatus.NOT_FOUND) return false;

        const path = (request.path || request.url || '').toLowerCase();
        const noisyPatterns = [
            /\.env(\/|$)/,
            /phpinfo\.php(\.|$)/,
            /phpversion\.php(\.|$)/,
            /server-info\.php(\.|$)/,
            /server-status\.php(\.|$)/,
            /_profiler\/phpinfo/,
            /_environment/,
            /webroot\/index\.php\/_environment/,
            /mail\/phpinfo\.php/,
            /cpanel\/phpinfo\.php/,
            /hosting\/phpinfo\.php/,
            /webmail\/phpinfo\.php/,
            /smtp\/phpinfo\.php/,
            /wp-admin\/phpinfo\.php/,
            /administrator\/phpinfo\.php/,
            /public_html\/phpinfo\.php/,
        ];

        return noisyPatterns.some((pattern) => pattern.test(path));
    }

    private handlePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
        statusCode: number;
        message: string;
        error: string;
    } {
        switch (exception.code) {
            case 'P2002': {
                const target = exception.meta?.target as string[] | undefined;
                const field = target?.join(', ') || 'ข้อมูล';
                return {
                    statusCode: HttpStatus.CONFLICT,
                    message: `${field} นี้มีอยู่ในระบบแล้ว`,
                    error: 'Duplicate Entry',
                };
            }

            case 'P2003':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'ข้อมูลที่อ้างอิงไม่ถูกต้องหรือไม่มีอยู่ในระบบ',
                    error: 'Foreign Key Constraint',
                };

            case 'P2025':
                return {
                    statusCode: HttpStatus.NOT_FOUND,
                    message: 'ไม่พบข้อมูลที่ต้องการ',
                    error: 'Record Not Found',
                };

            case 'P2000':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'ข้อมูลยาวเกินไป กรุณาลดความยาวของข้อมูล',
                    error: 'Value Too Long',
                };

            case 'P2011':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
                    error: 'Required Field Missing',
                };

            case 'P2005':
            case 'P2006':
                return {
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'รูปแบบข้อมูลไม่ถูกต้อง',
                    error: 'Invalid Data Format',
                };

            case 'P2024':
                return {
                    statusCode: HttpStatus.REQUEST_TIMEOUT,
                    message: 'การเชื่อมต่อฐานข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่',
                    error: 'Database Timeout',
                };

            case 'P2028':
                return {
                    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
                    message: 'ระบบมีประชาชนจำนวนมาก กรุณาลองใหม่ในภายหลัง',
                    error: 'Connection Pool Exhausted',
                };

            default:
                return {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'เกิดข้อผิดพลาดในการดำเนินการกับฐานข้อมูล',
                    error: 'Database Error',
                };
        }
    }
}
