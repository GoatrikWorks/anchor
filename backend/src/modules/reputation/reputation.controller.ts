import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ReputationService } from "./reputation.service";

@Controller("reputation")
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  @Get("leaderboard")
  async getLeaderboard(@Query("limit") limit?: string) {
    return this.reputationService.getLeaderboard(
      limit ? parseInt(limit, 10) : undefined
    );
  }

  @Get(":identityId")
  async getReputation(@Param("identityId", ParseIntPipe) identityId: number) {
    return this.reputationService.getReputation(identityId);
  }

  @Get(":identityId/history")
  async getReputationHistory(
    @Param("identityId", ParseIntPipe) identityId: number,
    @Query("limit") limit?: string
  ) {
    return this.reputationService.getReputationHistory(
      identityId,
      limit ? parseInt(limit, 10) : undefined
    );
  }
}
