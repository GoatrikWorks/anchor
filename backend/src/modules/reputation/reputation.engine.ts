import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AgreementStatus, Prisma } from "@prisma/client";

export interface ReputationComponents {
  trustworthiness: number;
  reliability: number;
  experience: number;
  disputes: number;
  [key: string]: number;
}

export interface ReputationResult {
  score: number;
  components: ReputationComponents;
}

@Injectable()
export class ReputationEngine {
  constructor(private prisma: PrismaService) {}

  async calculateReputation(identityId: number): Promise<ReputationResult> {
    const events = await this.prisma.agreementEvent.findMany({
      where: {
        OR: [
          { agreement: { proposerId: identityId } },
          { agreement: { acceptorId: identityId } },
        ],
      },
      include: { agreement: true },
      orderBy: { timestamp: "asc" },
    });

    const components = this.computeComponents(events, identityId);
    const score = this.computeTotalScore(components);

    return { score, components };
  }

  async recalculateAllReputations(blockNumber: bigint) {
    const identities = await this.prisma.identity.findMany();

    for (const identity of identities) {
      const result = await this.calculateReputation(identity.id);

      await this.prisma.reputationSnapshot.create({
        data: {
          identityId: identity.id,
          score: result.score,
          components: result.components,
          calculatedAt: new Date(),
          blockNumber,
        },
      });
    }
  }

  private computeComponents(events: any[], identityId: number): ReputationComponents {
    let completedAsProposer = 0;
    let completedAsAcceptor = 0;
    let breachedAgainst = 0;
    let breachedBy = 0;
    let disputesWon = 0;
    let disputesLost = 0;
    let totalAgreements = 0;

    const seenAgreements = new Set<number>();

    for (const event of events) {
      const agreement = event.agreement;
      const isProposer = agreement.proposerId === identityId;

      if (!seenAgreements.has(agreement.id)) {
        seenAgreements.add(agreement.id);
        totalAgreements++;
      }

      switch (event.eventType) {
        case "COMPLETED":
          if (isProposer) completedAsProposer++;
          else completedAsAcceptor++;
          break;

        case "BREACHED":
          const breachData = event.data as { breachedBy?: number };
          if (breachData.breachedBy === identityId) {
            breachedBy++;
          } else {
            breachedAgainst++;
          }
          break;

        case "DISPUTE_RESOLVED":
          const resolveData = event.data as { proposerFavored?: boolean };
          const wonDispute = isProposer
            ? resolveData.proposerFavored
            : !resolveData.proposerFavored;
          if (wonDispute) disputesWon++;
          else disputesLost++;
          break;
      }
    }

    const totalCompleted = completedAsProposer + completedAsAcceptor;

    const trustworthiness = this.calculateTrustworthiness(
      totalCompleted,
      breachedBy,
      totalAgreements
    );

    const reliability = this.calculateReliability(
      totalCompleted,
      breachedAgainst,
      disputesLost
    );

    const experience = this.calculateExperience(totalAgreements, totalCompleted);

    const disputes = this.calculateDisputeScore(disputesWon, disputesLost);

    return {
      trustworthiness: Math.round(trustworthiness),
      reliability: Math.round(reliability),
      experience: Math.round(experience),
      disputes: Math.round(disputes),
    };
  }

  private calculateTrustworthiness(
    completed: number,
    breachedBy: number,
    total: number
  ): number {
    if (total === 0) return 50;

    const successRate = completed / Math.max(total, 1);
    const breachPenalty = breachedBy * 15;

    return Math.max(0, Math.min(100, successRate * 100 - breachPenalty));
  }

  private calculateReliability(
    completed: number,
    breachedAgainst: number,
    disputesLost: number
  ): number {
    const base = 50;
    const completionBonus = Math.min(completed * 5, 40);
    const breachPenalty = breachedAgainst * 3;
    const disputePenalty = disputesLost * 5;

    return Math.max(0, Math.min(100, base + completionBonus - breachPenalty - disputePenalty));
  }

  private calculateExperience(total: number, completed: number): number {
    const activityScore = Math.min(total * 10, 60);
    const successScore = Math.min(completed * 8, 40);

    return Math.min(100, activityScore + successScore);
  }

  private calculateDisputeScore(won: number, lost: number): number {
    const total = won + lost;
    if (total === 0) return 50;

    const winRate = won / total;
    return Math.round(winRate * 100);
  }

  private computeTotalScore(components: ReputationComponents): number {
    const weights = {
      trustworthiness: 0.4,
      reliability: 0.3,
      experience: 0.2,
      disputes: 0.1,
    };

    const weighted =
      components.trustworthiness * weights.trustworthiness +
      components.reliability * weights.reliability +
      components.experience * weights.experience +
      components.disputes * weights.disputes;

    return Math.round(weighted);
  }
}
