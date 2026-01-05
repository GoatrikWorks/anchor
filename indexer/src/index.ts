import "dotenv/config";
import { createBlockchainListener } from "./listeners/blockchain.js";

async function main() {
  const rpcUrl = process.env.RPC_URL;
  const identityAddress = process.env.IDENTITY_CONTRACT_ADDRESS as `0x${string}`;
  const agreementsAddress = process.env.AGREEMENTS_CONTRACT_ADDRESS as `0x${string}`;

  if (!rpcUrl || !identityAddress || !agreementsAddress) {
    console.error("Missing required environment variables");
    process.exit(1);
  }

  console.log("Starting Anchor Indexer...");
  console.log(`RPC URL: ${rpcUrl}`);
  console.log(`Identity Contract: ${identityAddress}`);
  console.log(`Agreements Contract: ${agreementsAddress}`);

  const listener = await createBlockchainListener({
    rpcUrl,
    identityAddress,
    agreementsAddress,
  });

  await listener.startListening();

  console.log("Indexer running. Press Ctrl+C to exit.");

  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down...");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
