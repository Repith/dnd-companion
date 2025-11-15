import { Module } from "@nestjs/common";
import { CqrsModule as NestCqrsModule } from "@nestjs/cqrs";

@Module({
  imports: [NestCqrsModule.forRoot()],
  exports: [NestCqrsModule],
})
export class CqrsModule {}
