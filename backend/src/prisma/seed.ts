import { PrismaClient, OpportunityType, OpportunityStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.indexerState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, lastBlockNumber: BigInt(0) },
  });

  await prisma.worldState.upsert({
    where: { key: "tickNumber" },
    update: {},
    create: { key: "tickNumber", value: { tick: 0 } },
  });

  const opportunities = [
    {
      type: OpportunityType.MARKET_REQUEST,
      title: "Frakta varor till norra distriktet",
      description: "En handlare behöver hjälp att frakta känsliga varor till norra distriktet. Leverans inom 24 timmar krävs.",
      requirements: { minReputation: 20, riskLevel: 1 },
      rewards: { baseAmount: 100, reputationBonus: 5 },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      tickNumber: 1,
    },
    {
      type: OpportunityType.MARKET_REQUEST,
      title: "Sällsynt materialinsamling",
      description: "Samla sällsynta material från de östra marknaderna. Betalning vid leverans.",
      requirements: { minReputation: 30, riskLevel: 1 },
      rewards: { baseAmount: 150, reputationBonus: 7 },
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      tickNumber: 1,
    },
    {
      type: OpportunityType.FACTION_REQUEST,
      title: "Diplomatiskt uppdrag",
      description: "Representera fraktionen i förhandlingar med en rivaliserande grupp. Diskretion krävs.",
      requirements: { minReputation: 50, riskLevel: 2 },
      rewards: { baseAmount: 300, reputationBonus: 15 },
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
      tickNumber: 1,
    },
    {
      type: OpportunityType.FACTION_REQUEST,
      title: "Underrättelseinhämtning",
      description: "Samla information om fiendens rörelser. Rapportera tillbaka inom utsatt tid.",
      requirements: { minReputation: 45, riskLevel: 2 },
      rewards: { baseAmount: 250, reputationBonus: 12 },
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
      tickNumber: 1,
    },
    {
      type: OpportunityType.EXPEDITION,
      title: "Utforskning av okänt territorium",
      description: "Led en expedition in i outforskat område. Hög risk men stora möjligheter.",
      requirements: { minReputation: 70, riskLevel: 3 },
      rewards: { baseAmount: 500, reputationBonus: 25 },
      expiresAt: new Date(Date.now() + 96 * 60 * 60 * 1000),
      tickNumber: 1,
    },
    {
      type: OpportunityType.EXPEDITION,
      title: "Antika ruiner",
      description: "Utforska antika ruiner efter värdefulla fynd. Faror lurar i mörkret.",
      requirements: { minReputation: 60, riskLevel: 3 },
      rewards: { baseAmount: 450, reputationBonus: 20 },
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      tickNumber: 1,
    },
  ];

  for (const opp of opportunities) {
    await prisma.opportunity.create({
      data: {
        ...opp,
        status: OpportunityStatus.AVAILABLE,
      },
    });
  }

  console.log(`Created ${opportunities.length} opportunities`);
  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
