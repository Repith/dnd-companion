import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { SessionController } from "./session.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CampaignModule } from "../campaign/campaign.module";
import { CqrsModule } from "../cqrs/cqrs.module";
import { EventsModule } from "../events/events.module";
import { RollDiceHandler } from "./commands/roll-dice.handler";

@Module({
  imports: [PrismaModule, CampaignModule, CqrsModule, EventsModule],
  providers: [SessionService, RollDiceHandler],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
