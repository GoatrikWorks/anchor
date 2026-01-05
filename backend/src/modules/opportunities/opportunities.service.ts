import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReputationService } from "../reputation/reputation.service";
import { OpportunityType, OpportunityStatus } from "@prisma/client";

@Injectable()
export class OpportunitiesService {
  constructor(
    private prisma: PrismaService,
    private reputationService: ReputationService
  ) {}

  async getAvailableOpportunities(identityId?: number) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: { status: OpportunityStatus.AVAILABLE },
      orderBy: { createdAt: "desc" },
    });

    if (!identityId) {
      return opportunities.map((o) => this.formatOpportunity(o, false));
    }

    const reputation = await this.reputationService.getReputation(identityId);

    return opportunities.map((o) => {
      const requirements = o.requirements as { minReputation: number };
      const eligible = reputation.score >= requirements.minReputation;
      return this.formatOpportunity(o, eligible);
    });
  }

  async getOpportunityById(id: number) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
    });

    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }

    return this.formatOpportunity(opportunity, true);
  }

  async claimOpportunity(opportunityId: number, identityId: number) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }

    if (opportunity.status !== OpportunityStatus.AVAILABLE) {
      throw new ForbiddenException("Opportunity is not available");
    }

    const requirements = opportunity.requirements as { minReputation: number };
    const reputation = await this.reputationService.getReputation(identityId);

    if (reputation.score < requirements.minReputation) {
      throw new ForbiddenException("Insufficient reputation");
    }

    return this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        status: OpportunityStatus.CLAIMED,
        claimedBy: identityId,
      },
    });
  }

  async completeOpportunity(opportunityId: number, identityId: number) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException("Opportunity not found");
    }

    if (opportunity.claimedBy !== identityId) {
      throw new ForbiddenException("Not claimed by this identity");
    }

    if (opportunity.status !== OpportunityStatus.CLAIMED) {
      throw new ForbiddenException("Opportunity is not claimed");
    }

    return this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: OpportunityStatus.COMPLETED },
    });
  }

  async getOpportunitiesByType(type: OpportunityType) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        type,
        status: OpportunityStatus.AVAILABLE,
      },
      orderBy: { createdAt: "desc" },
    });

    return opportunities.map((o) => this.formatOpportunity(o, true));
  }

  async getClaimedOpportunities(identityId: number) {
    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        claimedBy: identityId,
        status: { in: [OpportunityStatus.CLAIMED, OpportunityStatus.COMPLETED] },
      },
      orderBy: { createdAt: "desc" },
    });

    return opportunities.map((o) => this.formatOpportunity(o, true));
  }

  private formatOpportunity(opportunity: any, eligible: boolean) {
    return {
      id: opportunity.id,
      type: opportunity.type,
      title: opportunity.title,
      description: opportunity.description,
      requirements: opportunity.requirements,
      rewards: opportunity.rewards,
      expiresAt: opportunity.expiresAt,
      status: opportunity.status,
      eligible,
      claimedBy: opportunity.claimedBy,
    };
  }
}
