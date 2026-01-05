import { Module } from "@nestjs/common";
import { OpportunitiesController } from "./opportunities.controller";
import { OpportunitiesService } from "./opportunities.service";
import { ReputationModule } from "../reputation/reputation.module";

@Module({
  imports: [ReputationModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
