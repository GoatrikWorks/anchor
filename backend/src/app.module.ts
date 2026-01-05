import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { AgreementsModule } from "./modules/agreements/agreements.module";
import { ReputationModule } from "./modules/reputation/reputation.module";
import { WorldModule } from "./modules/world/world.module";
import { OpportunitiesModule } from "./modules/opportunities/opportunities.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    IdentityModule,
    AgreementsModule,
    ReputationModule,
    WorldModule,
    OpportunitiesModule,
  ],
})
export class AppModule {}
