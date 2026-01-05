import { createPublicClient, http, parseAbiItem, type Log } from "viem";
import { foundry } from "viem/chains";
import { PrismaClient } from "@prisma/client";
import { IdentityABI } from "../abis/Identity.js";
import { AgreementsABI } from "../abis/Agreements.js";
import {
  processIdentityCreated,
  processTraitSet,
} from "../processors/identity.js";
import {
  processAgreementProposed,
  processAgreementAccepted,
  processAgreementCompleted,
  processAgreementBreached,
  processDisputeRaised,
  processDisputeResolved,
  processDepositWithdrawn,
} from "../processors/agreements.js";

const prisma = new PrismaClient();

export async function createBlockchainListener(config: {
  rpcUrl: string;
  identityAddress: `0x${string}`;
  agreementsAddress: `0x${string}`;
}) {
  const client = createPublicClient({
    chain: foundry,
    transport: http(config.rpcUrl),
  });

  async function getLastProcessedBlock(): Promise<bigint> {
    const state = await prisma.indexerState.findUnique({ where: { id: 1 } });
    return state?.lastBlockNumber ?? 0n;
  }

  async function updateLastProcessedBlock(blockNumber: bigint) {
    await prisma.indexerState.upsert({
      where: { id: 1 },
      update: { lastBlockNumber: blockNumber },
      create: { id: 1, lastBlockNumber: blockNumber },
    });
  }

  async function processLogs(logs: Log[]) {
    for (const log of logs) {
      const topic = log.topics[0];

      try {
        if (log.address.toLowerCase() === config.identityAddress.toLowerCase()) {
          await processIdentityLog(log, topic);
        } else if (log.address.toLowerCase() === config.agreementsAddress.toLowerCase()) {
          await processAgreementLog(log, topic);
        }
      } catch (error) {
        console.error(`Error processing log in tx ${log.transactionHash}:`, error);
      }
    }
  }

  async function processIdentityLog(log: Log, topic: string | undefined) {
    const identityCreatedTopic = "0x" + Buffer.from(
      "IdentityCreated(uint256,address,bytes32,uint256)"
    ).toString("hex").slice(0, 64);

    if (topic === identityCreatedTopic || log.topics.length === 3) {
      const identityId = BigInt(log.topics[1] ?? 0);
      const owner = "0x" + (log.topics[2] ?? "").slice(26);
      const data = log.data as `0x${string}`;
      const nameHash = "0x" + data.slice(2, 66);
      const timestamp = BigInt("0x" + data.slice(66, 130));

      await processIdentityCreated(log, {
        identityId,
        owner,
        nameHash,
        timestamp,
      });
    }
  }

  async function processAgreementLog(log: Log, topic: string | undefined) {
    const data = log.data as `0x${string}`;
    const agreementId = BigInt(log.topics[1] ?? 0);
    const secondIndexed = BigInt(log.topics[2] ?? 0);

    const eventSignatures: Record<string, string> = {
      AgreementProposed: "AgreementProposed(uint256,uint256,bytes32,uint256,uint256,uint256)",
      AgreementAccepted: "AgreementAccepted(uint256,uint256,uint256,uint256)",
      AgreementCompleted: "AgreementCompleted(uint256,uint256,uint256)",
      AgreementBreached: "AgreementBreached(uint256,uint256,uint256)",
      DisputeRaised: "DisputeRaised(uint256,uint256,bytes32,uint256)",
      DisputeResolved: "DisputeResolved(uint256,uint256,bool,uint256)",
      DepositWithdrawn: "DepositWithdrawn(uint256,uint256,uint256,uint256)",
    };

    const dataLength = data.length - 2;

    if (dataLength === 256) {
      const termsHash = "0x" + data.slice(2, 66);
      const requiredDeposit = BigInt("0x" + data.slice(66, 130));
      const deadline = BigInt("0x" + data.slice(130, 194));
      const timestamp = BigInt("0x" + data.slice(194, 258));

      await processAgreementProposed(log, {
        agreementId,
        proposerId: secondIndexed,
        termsHash,
        requiredDeposit,
        deadline,
        timestamp,
      });
    } else if (dataLength === 128) {
      const firstValue = BigInt("0x" + data.slice(2, 66));
      const secondValue = BigInt("0x" + data.slice(66, 130));

      if (firstValue > 1000000000n) {
        await processAgreementAccepted(log, {
          agreementId,
          acceptorId: secondIndexed,
          depositAmount: firstValue,
          timestamp: secondValue,
        });
      } else {
        await processDepositWithdrawn(log, {
          agreementId,
          identityId: secondIndexed,
          amount: firstValue,
          timestamp: secondValue,
        });
      }
    } else if (dataLength === 64) {
      const timestamp = BigInt("0x" + data.slice(2, 66));

      await processAgreementCompleted(log, {
        agreementId,
        completedBy: secondIndexed,
        timestamp,
      });
    }
  }

  async function syncHistoricalEvents(fromBlock: bigint, toBlock: bigint) {
    console.log(`Syncing events from block ${fromBlock} to ${toBlock}`);

    const identityLogs = await client.getLogs({
      address: config.identityAddress,
      fromBlock,
      toBlock,
    });

    const agreementLogs = await client.getLogs({
      address: config.agreementsAddress,
      fromBlock,
      toBlock,
    });

    const allLogs = [...identityLogs, ...agreementLogs].sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return Number(a.blockNumber) - Number(b.blockNumber);
      }
      return Number(a.logIndex) - Number(b.logIndex);
    });

    await processLogs(allLogs);
    await updateLastProcessedBlock(toBlock);
  }

  async function startListening() {
    const lastBlock = await getLastProcessedBlock();
    const currentBlock = await client.getBlockNumber();

    if (lastBlock < currentBlock) {
      await syncHistoricalEvents(lastBlock + 1n, currentBlock);
    }

    console.log("Starting real-time event listening...");

    client.watchBlocks({
      onBlock: async (block) => {
        const logs = await client.getLogs({
          address: [config.identityAddress, config.agreementsAddress],
          fromBlock: block.number,
          toBlock: block.number,
        });

        if (logs.length > 0) {
          await processLogs(logs);
        }

        await updateLastProcessedBlock(block.number!);
      },
    });
  }

  return { startListening, syncHistoricalEvents };
}
