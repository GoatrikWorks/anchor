import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ReputationEngine } from "./reputation.engine";

@Injectable()
export class ReputationService {
  constructor(
    private prisma: PrismaService,
    private engine: ReputationEngine
  ) {}

  async getReputation(identityId: number) {
    const latest = await this.prisma.reputationSnapshot.findFirst({
      where: { identityId },
      orderBy: { calculatedAt: "desc" },
    });

    if (!latest) {
      const calculated = await this.engine.calculateReputation(identityId);
      return {
        identityId,
        ...calculated,
        calculatedAt: new Date(),
        isLive: true,
      };
    }

    return {
      identityId,
      score: latest.score,
      components: latest.components,
      calculatedAt: latest.calculatedAt,
      isLive: false,
    };
  }

  async getReputationHistory(identityId: number, limit = 100) {
    return this.prisma.reputationSnapshot.findMany({
      where: { identityId },
      orderBy: { calculatedAt: "desc" },
      take: limit,
    });
  }

  async getLeaderboard(limit = 50) {
    const identities = await this.prisma.identity.findMany({
      include: {
        reputationSnapshots: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    const ranked = identities
      .map((i) => ({
        identityId: i.id,
        owner: i.owner,
        nameHash: i.nameHash,
        score: i.reputationSnapshots[0]?.score ?? 50,
        components: i.reputationSnapshots[0]?.components ?? null,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked.map((r, index) => ({ ...r, rank: index + 1 }));
  }

  async triggerRecalculation(blockNumber: bigint) {
    await this.engine.recalculateAllReputations(blockNumber);
  }
}
