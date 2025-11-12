import { Module } from "@nestjs/common";
import { CharacterService } from "./character.service";
import { CharacterController } from "./character.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { EventsModule } from "../events/events.module";
import { InventoryModule } from "../inventory/inventory.module";

@Module({
  imports: [PrismaModule, EventsModule, InventoryModule],
  providers: [CharacterService],
  controllers: [CharacterController],
  exports: [CharacterService],
})
export class CharacterModule {}
