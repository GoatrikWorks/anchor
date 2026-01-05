# Anchor

Ett persistent Web3 spel byggt på självägd identitet, avtal mellan spelare och långsiktig reputation.

## Vad är Anchor?

Anchor är ett spel som handlar om beslut, ansvar och konsekvens. Spelare skapar en permanent on chain identitet och ingår bindande avtal med varandra. Varje avtal kräver insatser i ETH och loggas permanent på blockchain. Genom att fullfölja avtal bygger du reputation, genom att bryta dem förlorar du den.

Världen fortsätter även när du är offline. Nya uppdrag genereras kontinuerligt och din reputation påverkar vilka möjligheter du får tillgång till.

## Snabbstart

Förutsättningar:
- Docker och Docker Compose
- Git

```bash
# Klona repot
git clone <repo-url> anchor
cd anchor

# Starta allt
./scripts/start.sh
```

När scriptet är klart:
- Klient: http://localhost:3000
- API: http://localhost:3001
- Anvil RPC: http://localhost:8545

## Testkonton

Anvil startar med förfinansierade testkonton. Använd det första kontot för att testa:

```
Adress: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Privat nyckel: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Importera den privata nyckeln i MetaMask och lägg till Foundry nätverket:
- Network Name: Foundry
- RPC URL: http://localhost:8545
- Chain ID: 31337
- Currency Symbol: ETH

## Använda spelet

1. Anslut din plånbok på http://localhost:3000
2. Signera inloggningsmeddelandet
3. Skapa din identitet under Profil
4. Utforska tillgängliga uppdrag
5. Föreslå eller acceptera avtal med andra spelare

## Projektstruktur

```
anchor/
├── contracts/    # Solidity smart contracts (Foundry)
├── indexer/      # Blockchain event indexer
├── backend/      # NestJS REST API
├── client/       # Next.js frontend
├── scripts/      # Hjälpscripts
└── docker/       # Docker konfiguration
```

## Utveckling

### Kör utan Docker

Starta beroenden:
```bash
docker compose up -d postgres redis anvil
```

Deploya contracts manuellt:
```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Starta indexer:
```bash
cd indexer
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Starta backend:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Starta klient:
```bash
cd client
npm install
npm run dev
```

### Kör tester

Smart contract tester:
```bash
cd contracts
forge test
```

## Stoppa och rensa

```bash
# Stoppa alla containers
./scripts/stop.sh

# Rensa allt och börja om
./scripts/reset.sh
```

## Teknisk stack

- Smart contracts: Solidity, Foundry, Anvil
- Indexer: Node.js, TypeScript, viem, Prisma
- Backend: NestJS, Prisma, PostgreSQL
- Client: Next.js, wagmi, viem
- Auth: SIWE (Sign In With Ethereum)
- Infra: Docker Compose

## API Endpoints

### Auth
- `GET /api/auth/nonce?address=0x...` Hämta nonce för signering
- `POST /api/auth/verify` Verifiera signatur och få JWT

### Identity
- `GET /api/identity` Lista alla identiteter
- `GET /api/identity/me` Hämta inloggad identitet
- `GET /api/identity/:id` Hämta specifik identitet
- `GET /api/identity/:id/agreements` Hämta identitetens avtal

### Agreements
- `GET /api/agreements` Lista alla avtal
- `GET /api/agreements/:id` Hämta specifikt avtal
- `GET /api/agreements/stats` Hämta statistik

### Reputation
- `GET /api/reputation/:identityId` Hämta reputation
- `GET /api/reputation/leaderboard` Topplista

### Opportunities
- `GET /api/opportunities` Lista tillgängliga uppdrag
- `POST /api/opportunities/:id/claim` Ta ett uppdrag
- `POST /api/opportunities/:id/complete` Slutför uppdrag

### World
- `GET /api/world/state` Världsstatus
