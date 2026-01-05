import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AgreementStatus } from "@prisma/client";

@Injectable()
export class AgreementsService {
  constructor(private prisma: PrismaService) {}

  async getAgreementById(id: number) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        proposer: true,
        acceptor: true,
        events: {
          orderBy: { timestamp: "asc" },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException("Agreement not found");
    }

    return this.formatAgreement(agreement);
  }

  async getAgreements(options: {
    status?: AgreementStatus;
    proposerId?: number;
    acceptorId?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const { status, proposerId, acceptorId, limit = 50, offset = 0 } = options;

    const where: any = {};
    if (status) where.status = status;
    if (proposerId) where.proposerId = proposerId;
    if (acceptorId) where.acceptorId = acceptorId;

    const agreements = await this.prisma.agreement.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        proposer: true,
        acceptor: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return agreements.map((a) => this.formatAgreement(a));
  }

  async getActiveAgreements() {
    return this.getAgreements({ status: AgreementStatus.ACTIVE });
  }

  async getProposedAgreements() {
    return this.getAgreements({ status: AgreementStatus.PROPOSED });
  }

  async getAgreementEvents(agreementId: number) {
    const events = await this.prisma.agreementEvent.findMany({
      where: { agreementId },
      orderBy: { timestamp: "asc" },
    });

    return events;
  }

  async getAgreementStats() {
    const [total, proposed, active, completed, breached, disputed] =
      await Promise.all([
        this.prisma.agreement.count(),
        this.prisma.agreement.count({ where: { status: AgreementStatus.PROPOSED } }),
        this.prisma.agreement.count({ where: { status: AgreementStatus.ACTIVE } }),
        this.prisma.agreement.count({ where: { status: AgreementStatus.COMPLETED } }),
        this.prisma.agreement.count({ where: { status: AgreementStatus.BREACHED } }),
        this.prisma.agreement.count({ where: { status: AgreementStatus.DISPUTED } }),
      ]);

    return { total, proposed, active, completed, breached, disputed };
  }

  private formatAgreement(agreement: any) {
    return {
      id: agreement.id,
      proposer: agreement.proposer
        ? {
            id: agreement.proposer.id,
            owner: agreement.proposer.owner,
            nameHash: agreement.proposer.nameHash,
          }
        : null,
      acceptor: agreement.acceptor
        ? {
            id: agreement.acceptor.id,
            owner: agreement.acceptor.owner,
            nameHash: agreement.acceptor.nameHash,
          }
        : null,
      termsHash: agreement.termsHash,
      proposerDeposit: agreement.proposerDeposit,
      acceptorDeposit: agreement.acceptorDeposit,
      deadline: agreement.deadline,
      status: agreement.status,
      createdAt: agreement.createdAt,
      events: agreement.events,
    };
  }
}
