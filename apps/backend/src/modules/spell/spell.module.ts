import { Module } from "@nestjs/common";
import { SpellService } from "./spell.service";
import { SpellController } from "./spell.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CqrsModule } from "../cqrs/cqrs.module";
import {
  CreateSpellHandler,
  UpdateSpellHandler,
  DeleteSpellHandler,
  GetSpellHandler,
  GetSpellsHandler,
} from "@dnd-companion/application";

@Module({
  imports: [PrismaModule, CqrsModule],
  controllers: [SpellController],
  providers: [
    SpellService,
    CreateSpellHandler,
    UpdateSpellHandler,
    DeleteSpellHandler,
    GetSpellHandler,
    GetSpellsHandler,
  ],
  exports: [SpellService],
})
export class SpellModule {}
