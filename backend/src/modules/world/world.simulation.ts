import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { ReputationService } from "../reputation/reputation.service";
import { OpportunityType, OpportunityStatus } from "@prisma/client";

interface OpportunityTemplate {
  type: OpportunityType;
  titles: string[];
  descriptions: string[];
  minReputation: number;
  baseReward: number;
  riskLevel: number;
}

const OPPORTUNITY_TEMPLATES: OpportunityTemplate[] = [
  {
    type: OpportunityType.MARKET_REQUEST,
    titles: [
      "Goods Transport Contract",
      "Rare Material Acquisition",
      "Trade Route Establishment",
      "Merchant Guild Commission",
    ],
    descriptions: [
      "A merchant seeks reliable transport of valuable goods",
      "Acquire rare materials from distant markets",
      "Establish a new trade route between settlements",
      "Complete a commission for the merchant guild",
    ],
    minReputation: 20,
    baseReward: 100,
    riskLevel: 1,
  },
  {
    type: OpportunityType.FACTION_REQUEST,
    titles: [
      "Diplomatic Mission",
      "Intelligence Gathering",
      "Resource Negotiation",
      "Alliance Proposal",
    ],
    descriptions: [
      "Represent a faction in diplomatic negotiations",
      "Gather intelligence on rival faction movements",
      "Negotiate resource sharing agreements",
      "Propose an alliance between factions",
    ],
    minReputation: 40,
    baseReward: 250,
    riskLevel: 2,
  },
  {
    type: OpportunityType.EXPEDITION,
    titles: [
      "Uncharted Territory Expedition",
      "Ancient Ruins Exploration",
      "Dangerous Route Survey",
      "Lost Artifact Recovery",
    ],
    descriptions: [
      "Lead an expedition into uncharted territory",
      "Explore ancient ruins for valuable discoveries",
      "Survey a dangerous route for future travelers",
      "Recover a lost artifact from hostile territory",
    ],
    minReputation: 60,
    baseReward: 500,
    riskLevel: 3,
  },
];

@Injectable()
export class WorldSimulation implements OnModuleInit {
  private readonly logger = new Logger(WorldSimulation.name);
  private tickNumber = 0;
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private reputationService: ReputationService
  ) {}

  async onModuleInit() {
    const state = await this.prisma.worldState.findUnique({
      where: { key: "tickNumber" },
    });

    if (state) {
      this.tickNumber = (state.value as { tick: number }).tick;
    }

    this.logger.log(`World simulation initialized at tick ${this.tickNumber}`);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tick() {
    if (this.isRunning) return;

    this.isRunning = true;

    try {
      this.tickNumber++;
      this.logger.log(`World tick ${this.tickNumber}`);

      await this.expireOldOpportunities();
      await this.generateOpportunities();
      await this.updateWorldState();

      if (this.tickNumber % 10 === 0) {
        await this.recalculateReputations();
      }
    } catch (error) {
      this.logger.error("Error in world tick:", error);
    } finally {
      this.isRunning = false;
    }
  }

  private async expireOldOpportunities() {
    const expired = await this.prisma.opportunity.updateMany({
      where: {
        status: OpportunityStatus.AVAILABLE,
        expiresAt: { lt: new Date() },
      },
      data: { status: OpportunityStatus.EXPIRED },
    });

    if (expired.count > 0) {
      this.logger.log(`Expired ${expired.count} opportunities`);
    }
  }

  private async generateOpportunities() {
    const activeCount = await this.prisma.opportunity.count({
      where: { status: OpportunityStatus.AVAILABLE },
    });

    const targetCount = 10;
    const toGenerate = Math.max(0, targetCount - activeCount);

    for (let i = 0; i < toGenerate; i++) {
      await this.createRandomOpportunity();
    }

    if (toGenerate > 0) {
      this.logger.log(`Generated ${toGenerate} new opportunities`);
    }
  }

  private async createRandomOpportunity() {
    const template = OPPORTUNITY_TEMPLATES[
      Math.floor(Math.random() * OPPORTUNITY_TEMPLATES.length)
    ];

    const title = template.titles[
      Math.floor(Math.random() * template.titles.length)
    ];

    const description = template.descriptions[
      Math.floor(Math.random() * template.descriptions.length)
    ];

    const rewardMultiplier = 0.8 + Math.random() * 0.4;
    const reward = Math.round(template.baseReward * rewardMultiplier);

    const durationHours = 1 + Math.floor(Math.random() * 23);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    await this.prisma.opportunity.create({
      data: {
        type: template.type,
        title,
        description,
        requirements: {
          minReputation: template.minReputation,
          riskLevel: template.riskLevel,
        },
        rewards: {
          baseAmount: reward,
          reputationBonus: Math.round(template.riskLevel * 5),
        },
        expiresAt,
        status: OpportunityStatus.AVAILABLE,
        tickNumber: this.tickNumber,
      },
    });
  }

  private async updateWorldState() {
    await this.prisma.worldState.upsert({
      where: { key: "tickNumber" },
      update: { value: { tick: this.tickNumber } },
      create: { key: "tickNumber", value: { tick: this.tickNumber } },
    });

    const stats = await this.getWorldStats();
    await this.prisma.worldState.upsert({
      where: { key: "stats" },
      update: { value: stats },
      create: { key: "stats", value: stats },
    });
  }

  private async recalculateReputations() {
    const indexerState = await this.prisma.indexerState.findUnique({
      where: { id: 1 },
    });

    const blockNumber = indexerState?.lastBlockNumber ?? 0n;
    await this.reputationService.triggerRecalculation(blockNumber);

    this.logger.log("Recalculated all reputations");
  }

  async getWorldStats() {
    const [identityCount, agreementCount, opportunityCount] = await Promise.all([
      this.prisma.identity.count(),
      this.prisma.agreement.count(),
      this.prisma.opportunity.count({
        where: { status: OpportunityStatus.AVAILABLE },
      }),
    ]);

    return {
      identityCount,
      agreementCount,
      activeOpportunities: opportunityCount,
      currentTick: this.tickNumber,
      lastUpdated: new Date().toISOString(),
    };
  }

  getCurrentTick(): number {
    return this.tickNumber;
  }
}
