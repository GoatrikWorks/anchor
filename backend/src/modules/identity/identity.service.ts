import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class IdentityService {
  constructor(private prisma: PrismaService) {}

  async getIdentityById(id: number) {
    const identity = await this.prisma.identity.findUnique({
      where: { id },
      include: {
        traits: true,
        reputationSnapshots: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!identity) {
      throw new NotFoundException("Identity not found");
    }

    return this.formatIdentity(identity);
  }

  async getIdentityByAddress(address: string) {
    const identity = await this.prisma.identity.findUnique({
      where: { owner: address.toLowerCase() },
      include: {
        traits: true,
        reputationSnapshots: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!identity) {
      return null;
    }

    return this.formatIdentity(identity);
  }

  async getIdentities(options: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = options;

    const identities = await this.prisma.identity.findMany({
      take: limit,
      skip: offset,
      include: {
        traits: true,
        reputationSnapshots: {
          orderBy: { calculatedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return identities.map((i) => this.formatIdentity(i));
  }

  async getIdentityAgreements(identityId: number) {
    const proposed = await this.prisma.agreement.findMany({
      where: { proposerId: identityId },
      orderBy: { createdAt: "desc" },
    });

    const accepted = await this.prisma.agreement.findMany({
      where: { acceptorId: identityId },
      orderBy: { createdAt: "desc" },
    });

    return { proposed, accepted };
  }

  private formatIdentity(identity: any) {
    const latestReputation = identity.reputationSnapshots?.[0];

    return {
      id: identity.id,
      owner: identity.owner,
      nameHash: identity.nameHash,
      createdAt: identity.createdAt,
      traits: identity.traits.reduce(
        (acc: Record<string, string>, t: any) => {
          acc[t.key] = t.value;
          return acc;
        },
        {}
      ),
      reputation: latestReputation
        ? {
            score: latestReputation.score,
            components: latestReputation.components,
            calculatedAt: latestReputation.calculatedAt,
          }
        : null,
    };
  }
}
