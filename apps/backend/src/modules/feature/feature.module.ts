import { Module } from "@nestjs/common";
import { FeatureService } from "./feature.service";
import { FeatureController } from "./feature.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
