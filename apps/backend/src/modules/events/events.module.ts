import { Module } from "@nestjs/common";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { EventBusService } from "./event-bus.service";
import { EventLoggingService } from "./event-logging.service";
import { EventsController } from "./events.controller";
import {
  DamageEventHandler,
  HealingEventHandler,
  ItemEventHandler,
  SpellEventHandler,
  QuestEventHandler,
  LevelUpEventHandler,
  DeathEventHandler,
} from "./event-handlers";

@Module({
  imports: [PrismaModule],
  providers: [
    EventBusService,
    EventLoggingService,
    // Event handlers
    DamageEventHandler,
    HealingEventHandler,
    ItemEventHandler,
    SpellEventHandler,
    QuestEventHandler,
    LevelUpEventHandler,
    DeathEventHandler,
  ],
  controllers: [EventsController],
  exports: [EventBusService, EventLoggingService],
})
export class EventsModule {}
