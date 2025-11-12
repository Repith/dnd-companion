import { Module } from "@nestjs/common";
import { QuestService } from "./quest.service";
import { QuestController } from "./quest.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CampaignModule } from "../campaign/campaign.module";
import { EventsModule } from "../events/events.module";

@Module({
  imports: [PrismaModule, CampaignModule, EventsModule],
  providers: [QuestService],
  controllers: [QuestController],
  exports: [QuestService],
})
export class QuestModule {}
