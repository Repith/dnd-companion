import { Module } from "@nestjs/common";
import { DiceRollService } from "./dice-roll.service";
import { DiceRollController } from "./dice-roll.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [DiceRollService],
  controllers: [DiceRollController],
  exports: [DiceRollService],
})
export class DiceRollModule {}
