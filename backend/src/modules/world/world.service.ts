import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WorldSimulation } from "./world.simulation";

@Injectable()
export class WorldService {
  constructor(
    private prisma: PrismaService,
    private simulation: WorldSimulation
  ) {}

  async getWorldState() {
    const stats = await this.simulation.getWorldStats();

    return stats;
  }

  async getWorldHistory(limit = 100) {
    return [];
  }
}
