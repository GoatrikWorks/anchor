import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { OpportunitiesService } from "./opportunities.service";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/user.decorator";
import { OpportunityType } from "@prisma/client";

@Controller("opportunities")
export class OpportunitiesController {
  constructor(private opportunitiesService: OpportunitiesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getAvailableOpportunities(@CurrentUser() user?: AuthUser) {
    return this.opportunitiesService.getAvailableOpportunities(
      user?.identityId ?? undefined
    );
  }

  @Get("type/:type")
  async getByType(@Param("type") type: OpportunityType) {
    return this.opportunitiesService.getOpportunitiesByType(type);
  }

  @Get("claimed")
  @UseGuards(JwtAuthGuard)
  async getClaimedOpportunities(@CurrentUser() user: AuthUser) {
    if (!user.identityId) {
      throw new ForbiddenException("Identity required");
    }
    return this.opportunitiesService.getClaimedOpportunities(user.identityId);
  }

  @Get(":id")
  async getOpportunity(@Param("id", ParseIntPipe) id: number) {
    return this.opportunitiesService.getOpportunityById(id);
  }

  @Post(":id/claim")
  @UseGuards(JwtAuthGuard)
  async claimOpportunity(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser
  ) {
    if (!user.identityId) {
      throw new ForbiddenException("Identity required");
    }
    return this.opportunitiesService.claimOpportunity(id, user.identityId);
  }

  @Post(":id/complete")
  @UseGuards(JwtAuthGuard)
  async completeOpportunity(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser
  ) {
    if (!user.identityId) {
      throw new ForbiddenException("Identity required");
    }
    return this.opportunitiesService.completeOpportunity(id, user.identityId);
  }
}
