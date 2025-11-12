import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        {
          emit: "event",
          level: "query",
        },
        {
          emit: "event",
          level: "error",
        },
        {
          emit: "event",
          level: "info",
        },
        {
          emit: "event",
          level: "warn",
        },
      ],
    });

    // Listen to Prisma events and log them
    (this as any).$on("query", (e: any) => {
      this.logger.log(`Database query executed`, {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });

    (this as any).$on("error", (e: any) => {
      this.logger.error(`Database error occurred`, {
        target: e.target,
        message: e.message,
      });
    });

    (this as any).$on("info", (e: any) => {
      this.logger.log(`Database info`, {
        target: e.target,
        message: e.message,
      });
    });

    (this as any).$on("warn", (e: any) => {
      this.logger.warn(`Database warning`, {
        target: e.target,
        message: e.message,
      });
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Database connection established");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database connection closed");
  }
}
