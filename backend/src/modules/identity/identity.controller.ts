import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IdentityService } from "./identity.service";
import { JwtAuthGuard, OptionalJwtAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/user.decorator";

@Controller("identity")
export class IdentityController {
  constructor(private identityService: IdentityService) {}

  @Get()
  async getIdentities(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.identityService.getIdentities({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyIdentity(@CurrentUser() user: AuthUser) {
    return this.identityService.getIdentityByAddress(user.address);
  }

  @Get(":id")
  async getIdentity(@Param("id", ParseIntPipe) id: number) {
    return this.identityService.getIdentityById(id);
  }

  @Get(":id/agreements")
  async getIdentityAgreements(@Param("id", ParseIntPipe) id: number) {
    return this.identityService.getIdentityAgreements(id);
  }
}
