import { Module } from "@nestjs/common";
import { CharacterService } from "./character.service";
import { CharacterController } from "./character.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { EventsModule } from "../events/events.module";
import { InventoryModule } from "../inventory/inventory.module";
import { CqrsModule } from "../cqrs/cqrs.module";
import { AddSkillProficiencyHandler } from "./commands/add-skill-proficiency.handler";
import { GainExperienceHandler } from "./commands/gain-experience.handler";
import { UpdateCharacterLevelHandler } from "./commands/update-character-level.handler";
import { GetCharacterByIdHandler } from "./queries/get-character-by-id.handler";

@Module({
  imports: [PrismaModule, EventsModule, InventoryModule, CqrsModule],
  providers: [
    CharacterService,
    AddSkillProficiencyHandler,
    GainExperienceHandler,
    UpdateCharacterLevelHandler,
    GetCharacterByIdHandler,
  ],
  controllers: [CharacterController],
  exports: [CharacterService],
})
export class CharacterModule {}
