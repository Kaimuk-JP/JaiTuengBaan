import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters';

const logger = new Logger('Bootstrap');

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL',
  'PORT',
] as const;

function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(', ')}`,
    );
    logger.error('กรุณาตรวจสอบไฟล์ .env หรือ environment ของ container');
    process.exit(1);
  }
}

function parsePort(): number {
  const raw = process.env.PORT;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.error(`❌ Invalid PORT value: "${raw}" — ต้องเป็นเลข 1-65535`);
    process.exit(1);
  }
  return port;
}

function parseCorsOrigins(): string[] | string {
  const raw = process.env.FRONTEND_URL!;
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    logger.error('❌ FRONTEND_URL is empty after parsing');
    process.exit(1);
  }
  return origins.length === 1 ? origins[0] : origins;
}

async function bootstrap() {
  validateEnv();

  const PORT = parsePort();
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isDev = NODE_ENV === 'development';
  const isProduction = NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: isDev
      ? ['log', 'debug', 'error', 'warn', 'verbose']
      : ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  process.on('unhandledRejection', (reason: any) => {
    logger.error('⚠️ Unhandled Rejection:', reason?.stack || reason);
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error('💥 Uncaught Exception:', error.stack);
    process.exit(1);
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: isDev
        ? false
        : {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", 'https://static.cloudflareinsights.com'],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https://*.line-scdn.net'],
              connectSrc: ["'self'", process.env.FRONTEND_URL!],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          },
    }),
  );

  const cookieSecret = process.env.COOKIE_SECRET || process.env.JWT_SECRET;
  app.use(cookieParser(cookieSecret));

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));
        return new BadRequestException({
          statusCode: 400,
          error: 'Validation Failed',
          message: messages,
        });
      },
    }),
  );

  const swaggerUser = process.env.SWAGGER_USER;
  const swaggerPassword = process.env.SWAGGER_PASSWORD;

  if (!isDev && swaggerUser && swaggerPassword) {
    app.use(
      ['/api', '/api-json'],
      basicAuth({
        challenge: true,
        users: { [swaggerUser]: swaggerPassword },
      }),
    );
  }

  const config = new DocumentBuilder()
    .setTitle('JaiSongTuengBaan API')
    .setDescription('API documentation สำหรับระบบจิตอาสารับส่ง')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addCookieAuth('access_token')
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User Management')
    .addTag('Queues', 'Queue/Booking Management')
    .addTag('Jobs', 'Job Management')
    .addTag('Notifications', 'Notification Management')
    .addTag('Upload', 'File Upload')
    .addTag('ProfileEditRequest', 'Profile Edit Request Management')
    .addTag('LINE Messaging', 'LINE Messaging API - Push, Reply, Rich Menu')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    maxAge: 86400,
  });

  const host = isProduction ? '0.0.0.0' : '0.0.0.0';
  await app.listen(PORT, host);

  logger.log(`🚀 Server running on: http://${host}:${PORT} [${NODE_ENV}]`);
  logger.log(`📚 Swagger API docs: http://${host}:${PORT}/api`);

  if (isProduction) {
    logger.log('🔒 Production mode — CSP enabled, Swagger protected');
  }
}

bootstrap().catch((error) => {
  logger.error('❌ Failed to start application:', error);
  process.exit(1);
});
