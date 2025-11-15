import { Module } from "@nestjs/common";
import { QuestService } from "./quest.service";
import { QuestController } from "./quest.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CampaignModule } from "../campaign/campaign.module";
import { EventsModule } from "../events/events.module";
import { CharacterModule } from "../character/character.module";
import { InventoryModule } from "../inventory/inventory.module";
import { CqrsModule } from "../cqrs/cqrs.module";
import { FinishQuestHandler } from "./commands/finish-quest.handler";

@Module({
  imports: [
    PrismaModule,
    CampaignModule,
    EventsModule,
    CharacterModule,
    InventoryModule,
    CqrsModule,
  ],
  providers: [QuestService, FinishQuestHandler],
  controllers: [QuestController],
  exports: [QuestService],
})
export class QuestModule {}
