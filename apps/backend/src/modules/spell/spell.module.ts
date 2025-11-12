import { Module } from "@nestjs/common";
import { SpellService } from "./spell.service";
import { SpellController } from "./spell.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [SpellController],
  providers: [SpellService],
  exports: [SpellService],
})
export class SpellModule {}
