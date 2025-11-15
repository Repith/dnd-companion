import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UserModule } from "./modules/user/user.module";
import { CharacterModule } from "./modules/character/character.module";
import { ItemModule } from "./modules/item/item.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { AuthModule } from "./modules/auth/auth.module";
import { SpellModule } from "./modules/spell/spell.module";
import { FeatureModule } from "./modules/feature/feature.module";
import { CampaignModule } from "./modules/campaign/campaign.module";
import { QuestModule } from "./modules/quest/quest.module";
import { SessionModule } from "./modules/session/session.module";
import { GeneratorModule } from "./modules/generator/generator.module";
import { DMZoneModule } from "./modules/dm-zone/dm-zone.module";
import { DiceRollModule } from "./modules/dice-roll/dice-roll.module";
import { PrismaModule } from "./common/prisma/prisma.module";
import { CqrsModule } from "./modules/cqrs/cqrs.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../.env",
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    CharacterModule,
    ItemModule,
    InventoryModule,
    SpellModule,
    FeatureModule,
    CampaignModule,
    QuestModule,
    SessionModule,
    GeneratorModule,
    DMZoneModule,
    DiceRollModule,
    CqrsModule,
  ],
})
export class AppModule {}
