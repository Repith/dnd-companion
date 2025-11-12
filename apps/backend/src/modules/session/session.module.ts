import { Module } from "@nestjs/common";
import { SessionService } from "./session.service";
import { SessionController } from "./session.controller";
import { PrismaModule } from "../../common/prisma/prisma.module";
import { CampaignModule } from "../campaign/campaign.module";

@Module({
  imports: [PrismaModule, CampaignModule],
  providers: [SessionService],
  controllers: [SessionController],
  exports: [SessionService],
})
export class SessionModule {}
