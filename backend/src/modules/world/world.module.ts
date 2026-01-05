import { Module } from "@nestjs/common";
import { WorldController } from "./world.controller";
import { WorldService } from "./world.service";
import { WorldSimulation } from "./world.simulation";
import { ReputationModule } from "../reputation/reputation.module";

@Module({
  imports: [ReputationModule],
  controllers: [WorldController],
  providers: [WorldService, WorldSimulation],
  exports: [WorldService, WorldSimulation],
})
export class WorldModule {}
