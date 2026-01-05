import { PrismaClient, AgreementStatus, Prisma } from "@prisma/client";
import type { Log } from "viem";

const prisma = new PrismaClient();

export async function processAgreementProposed(log: Log, decoded: {
  agreementId: bigint;
  proposerId: bigint;
  termsHash: string;
  requiredDeposit: bigint;
  deadline: bigint;
  timestamp: bigint;
}) {
  await prisma.agreement.create({
    data: {
      id: Number(decoded.agreementId),
      proposerId: Number(decoded.proposerId),
      termsHash: decoded.termsHash,
      proposerDeposit: decoded.requiredDeposit.toString(),
      acceptorDeposit: decoded.requiredDeposit.toString(),
      deadline: new Date(Number(decoded.deadline) * 1000),
      status: AgreementStatus.PROPOSED,
      createdAt: new Date(Number(decoded.timestamp) * 1000),
      blockNumber: log.blockNumber!,
      txHash: log.transactionHash!,
    },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "PROPOSED", {
    proposerId: Number(decoded.proposerId),
    termsHash: decoded.termsHash,
    requiredDeposit: decoded.requiredDeposit.toString(),
    deadline: Number(decoded.deadline),
  }, decoded.timestamp);

  console.log(`Agreement ${decoded.agreementId} proposed by identity ${decoded.proposerId}`);
}

export async function processAgreementAccepted(log: Log, decoded: {
  agreementId: bigint;
  acceptorId: bigint;
  depositAmount: bigint;
  timestamp: bigint;
}) {
  await prisma.agreement.update({
    where: { id: Number(decoded.agreementId) },
    data: {
      acceptorId: Number(decoded.acceptorId),
      acceptorDeposit: decoded.depositAmount.toString(),
      status: AgreementStatus.ACTIVE,
    },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "ACCEPTED", {
    acceptorId: Number(decoded.acceptorId),
    depositAmount: decoded.depositAmount.toString(),
  }, decoded.timestamp);

  console.log(`Agreement ${decoded.agreementId} accepted by identity ${decoded.acceptorId}`);
}

export async function processAgreementCompleted(log: Log, decoded: {
  agreementId: bigint;
  completedBy: bigint;
  timestamp: bigint;
}) {
  await prisma.agreement.update({
    where: { id: Number(decoded.agreementId) },
    data: { status: AgreementStatus.COMPLETED },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "COMPLETED", {
    completedBy: Number(decoded.completedBy),
  }, decoded.timestamp);

  console.log(`Agreement ${decoded.agreementId} completed by identity ${decoded.completedBy}`);
}

export async function processAgreementBreached(log: Log, decoded: {
  agreementId: bigint;
  breachedBy: bigint;
  timestamp: bigint;
}) {
  await prisma.agreement.update({
    where: { id: Number(decoded.agreementId) },
    data: { status: AgreementStatus.BREACHED },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "BREACHED", {
    breachedBy: Number(decoded.breachedBy),
  }, decoded.timestamp);

  console.log(`Agreement ${decoded.agreementId} breached by identity ${decoded.breachedBy}`);
}

export async function processDisputeRaised(log: Log, decoded: {
  agreementId: bigint;
  raisedBy: bigint;
  reasonHash: string;
  timestamp: bigint;
}) {
  await prisma.agreement.update({
    where: { id: Number(decoded.agreementId) },
    data: { status: AgreementStatus.DISPUTED },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "DISPUTE_RAISED", {
    raisedBy: Number(decoded.raisedBy),
    reasonHash: decoded.reasonHash,
  }, decoded.timestamp);

  console.log(`Dispute raised on agreement ${decoded.agreementId} by identity ${decoded.raisedBy}`);
}

export async function processDisputeResolved(log: Log, decoded: {
  agreementId: bigint;
  resolver: bigint;
  proposerFavored: boolean;
  timestamp: bigint;
}) {
  await prisma.agreement.update({
    where: { id: Number(decoded.agreementId) },
    data: { status: AgreementStatus.RESOLVED },
  });

  await createAgreementEvent(log, Number(decoded.agreementId), "DISPUTE_RESOLVED", {
    resolver: Number(decoded.resolver),
    proposerFavored: decoded.proposerFavored,
  }, decoded.timestamp);

  console.log(`Dispute resolved on agreement ${decoded.agreementId}, proposer favored: ${decoded.proposerFavored}`);
}

export async function processDepositWithdrawn(log: Log, decoded: {
  agreementId: bigint;
  identityId: bigint;
  amount: bigint;
  timestamp: bigint;
}) {
  await createAgreementEvent(log, Number(decoded.agreementId), "DEPOSIT_WITHDRAWN", {
    identityId: Number(decoded.identityId),
    amount: decoded.amount.toString(),
  }, decoded.timestamp);

  console.log(`Deposit withdrawn from agreement ${decoded.agreementId} by identity ${decoded.identityId}`);
}

async function createAgreementEvent(
  log: Log,
  agreementId: number,
  eventType: string,
  data: Prisma.InputJsonValue,
  timestamp: bigint
) {
  await prisma.agreementEvent.create({
    data: {
      agreementId,
      eventType,
      data,
      timestamp: new Date(Number(timestamp) * 1000),
      blockNumber: log.blockNumber!,
      txHash: log.transactionHash!,
    },
  });
}
