import { Module } from "@nestjs/common";
import { GeneratorService } from "./generator.service";
import { GeneratorController } from "./generator.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  providers: [GeneratorService],
  controllers: [GeneratorController],
  exports: [GeneratorService],
})
export class GeneratorModule {}
