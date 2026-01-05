import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { AgreementsService } from "./agreements.service";
import { AgreementStatus } from "@prisma/client";

@Controller("agreements")
export class AgreementsController {
  constructor(private agreementsService: AgreementsService) {}

  @Get()
  async getAgreements(
    @Query("status") status?: AgreementStatus,
    @Query("proposerId") proposerId?: string,
    @Query("acceptorId") acceptorId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.agreementsService.getAgreements({
      status,
      proposerId: proposerId ? parseInt(proposerId, 10) : undefined,
      acceptorId: acceptorId ? parseInt(acceptorId, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("stats")
  async getStats() {
    return this.agreementsService.getAgreementStats();
  }

  @Get("active")
  async getActiveAgreements() {
    return this.agreementsService.getActiveAgreements();
  }

  @Get("proposed")
  async getProposedAgreements() {
    return this.agreementsService.getProposedAgreements();
  }

  @Get(":id")
  async getAgreement(@Param("id", ParseIntPipe) id: number) {
    return this.agreementsService.getAgreementById(id);
  }

  @Get(":id/events")
  async getAgreementEvents(@Param("id", ParseIntPipe) id: number) {
    return this.agreementsService.getAgreementEvents(id);
  }
}
