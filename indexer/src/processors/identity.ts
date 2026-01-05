import { PrismaClient } from "@prisma/client";
import type { Log } from "viem";

const prisma = new PrismaClient();

export async function processIdentityCreated(log: Log, decoded: {
  identityId: bigint;
  owner: string;
  nameHash: string;
  timestamp: bigint;
}) {
  await prisma.identity.upsert({
    where: { id: Number(decoded.identityId) },
    update: {},
    create: {
      id: Number(decoded.identityId),
      owner: decoded.owner.toLowerCase(),
      nameHash: decoded.nameHash,
      createdAt: new Date(Number(decoded.timestamp) * 1000),
      blockNumber: log.blockNumber!,
      txHash: log.transactionHash!,
    },
  });

  console.log(`Identity ${decoded.identityId} created for ${decoded.owner}`);
}

export async function processTraitSet(log: Log, decoded: {
  identityId: bigint;
  traitKey: string;
  traitValue: string;
  timestamp: bigint;
}) {
  await prisma.trait.upsert({
    where: {
      identityId_key: {
        identityId: Number(decoded.identityId),
        key: decoded.traitKey,
      },
    },
    update: {
      value: decoded.traitValue,
      setAt: new Date(Number(decoded.timestamp) * 1000),
      blockNumber: log.blockNumber!,
      txHash: log.transactionHash!,
    },
    create: {
      identityId: Number(decoded.identityId),
      key: decoded.traitKey,
      value: decoded.traitValue,
      setAt: new Date(Number(decoded.timestamp) * 1000),
      blockNumber: log.blockNumber!,
      txHash: log.transactionHash!,
    },
  });

  console.log(`Trait set for identity ${decoded.identityId}: ${decoded.traitKey}`);
}
