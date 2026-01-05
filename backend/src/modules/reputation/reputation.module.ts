import { Module } from "@nestjs/common";
import { ReputationController } from "./reputation.controller";
import { ReputationService } from "./reputation.service";
import { ReputationEngine } from "./reputation.engine";

@Module({
  controllers: [ReputationController],
  providers: [ReputationService, ReputationEngine],
  exports: [ReputationService, ReputationEngine],
})
export class ReputationModule {}
