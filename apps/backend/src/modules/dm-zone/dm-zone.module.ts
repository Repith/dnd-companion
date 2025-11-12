import { Module } from "@nestjs/common";
import { LocationService } from "./location.service";
import { DMNoteService } from "./dm-note.service";
import { LocationController } from "./location.controller";
import { DMNoteController } from "./dm-note.controller";
import { CampaignService } from "../campaign/campaign.service";
import { PrismaService } from "../../common/prisma/prisma.service";

@Module({
  controllers: [LocationController, DMNoteController],
  providers: [LocationService, DMNoteService, CampaignService, PrismaService],
  exports: [LocationService, DMNoteService],
})
export class DMZoneModule {}
