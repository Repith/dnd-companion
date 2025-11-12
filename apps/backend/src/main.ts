import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { AppModule } from "./app.module";
import { SecurityMiddleware } from "./common/middleware/security.middleware";
import { LoggingInterceptor } from "./common/logging/logging.interceptor";
import { AllExceptionsFilter } from "./common/logging/exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply security middleware
  const securityMiddleware = new SecurityMiddleware();
  app.use(securityMiddleware.use.bind(securityMiddleware));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  });

  await app.listen(process.env.PORT || 3002);
}
bootstrap();
