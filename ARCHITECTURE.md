# Arkitektur

Detta dokument beskriver de tekniska besluten och designvalen i Anchor.

## Översikt

Anchor är ett persistent Web3 spel där spelare interagerar genom bindande avtal och bygger långsiktig reputation. Arkitekturen är uppdelad i on chain och off chain komponenter.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │     │  (NestJS)   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   ▲
       │                   │
       ▼                   │
┌─────────────┐     ┌─────────────┐
│   Anvil     │◀────│   Indexer   │
│ (Blockchain)│     │             │
└─────────────┘     └─────────────┘
```

## On chain komponenter

### Identity.sol

Registry för spelaridentiteter. Varje adress kan endast skapa en identitet och den kan inte överföras. Beslutet att göra identiteter non transferable grundas i att reputation ska vara permanent kopplad till en spelare.

Traits lagras som bytes32 key value par. Detta ger flexibilitet utan att behöva uppgradera kontraktet för nya egenskaper.

### Agreements.sol

Hanterar bindande avtal mellan identiteter. Designval:

1. Deposits krävs från båda parter. Detta skapar verkliga konsekvenser och gör att spelare tar avtal på allvar.

2. Alla tillståndsändringar emittar events. Detta gör att off chain system kan bygga fullständig historik.

3. Enkel dispute mekanism med extern arbiter. För MVP räcker det med en central arbiter. I framtida versioner kan detta ersättas med ett decentraliserat system.

4. Status är en enum som representerar livscykeln: Proposed, Active, Completed, Breached, Disputed, Resolved.

## Off chain komponenter

### Indexer

Lyssnar på blockchain events och skriver till PostgreSQL. Motivering:

1. Läsa direkt från blockchain är långsamt och dyrt.
2. Komplexa queries är omöjliga on chain.
3. Historik måste kunna återskapas från events.

Indexern sparar lastBlockNumber för att kunna återuppta från rätt position efter omstart.

### Backend (NestJS)

REST API som exponerar data och hanterar auth. Moduler:

- **Auth**: SIWE baserad autentisering. Spelaren signerar ett meddelande med sin plånbok för att bevisa ägarskap. JWT används för efterföljande requests.

- **Identity**: CRUD för identiteter och traits.

- **Agreements**: Läsning av avtal och statistik.

- **Reputation**: Beräkning och caching av reputationspoäng.

- **World**: Tick baserad simulation och state management.

- **Opportunities**: Uppdrag som genereras av världen.

### Reputation Engine

Beräknar reputation deterministiskt från agreement events. Komponenter:

- **Trustworthiness**: Baserat på slutförda vs brutna avtal.
- **Reliability**: Hur ofta spelaren blir utsatt för breach.
- **Experience**: Total aktivitet i systemet.
- **Disputes**: Win rate i tvister.

Poängen viktas och summeras till en total score. Beräkningen är deterministisk vilket betyder att samma events alltid ger samma resultat. Detta gör det möjligt att verifiera eller köra om beräkningar.

### World Simulation

En tick baserad process som:

1. Förfaller gamla opportunities
2. Genererar nya opportunities baserat på världsstate
3. Uppdaterar global state
4. Triggar reputation recalculation periodiskt

Tick intervallet är konfigurerbart via miljövariabel. Default är 60 sekunder.

### Client (Next.js)

Minimal men funktionell UI. Använder wagmi för wallet interaction och viem för blockchain kommunikation. SIWE hanteras via siwe paketet.

State management sker via React Query för server state och lokal React state för UI. Ingen global state manager behövs i detta skede.

## Dataflöde

### Skapa identitet

1. Användare ansluter plånbok
2. Användare signerar SIWE meddelande
3. Backend verifierar och skapar JWT
4. Användare anropar createIdentity på kontraktet
5. Indexer fångar IdentityCreated event
6. Indexer skriver till DB
7. Backend kan läsa identitet från DB

### Föreslå avtal

1. Användare fyller i avtalstermer
2. Klient anropar proposeAgreement med deposit
3. Indexer fångar AgreementProposed event
4. Avtalet syns i listan för andra spelare

### Slutföra avtal

1. Part anropar completeAgreement
2. Indexer fångar AgreementCompleted event
3. Reputation engine recalculates affected identities
4. Deposits kan nu tas ut

## Säkerhetsöverväganden

1. **Reentrancy**: Agreements kontraktet följer checks effects interactions mönstret. Deposits dras först, sedan sker extern call.

2. **Access control**: Endast identity owners kan agera på sina identiteter. Endast agreement parter kan agera på sina avtal.

3. **Input validation**: Solidity kontrakten validerar alla inputs. Backend validerar via class validator.

4. **JWT**: Tokens har begränsad livslängd. Secret måste bytas i produktion.

## Skalbarhet

Nuvarande arkitektur är byggd för MVP. Saker att överväga för skalning:

1. **Indexer**: Kan bli flaskhals vid hög event throughput. Lösning: Event batching eller parallell processing.

2. **Reputation**: Recalculation av alla identiteter är O(n). Lösning: Inkrementella uppdateringar.

3. **Database**: Postgres klarar signifikant last men indexering är kritisk. Befintliga index täcker vanliga queries.

4. **Blockchain**: Anvil är för utveckling. Produktion kräver riktig L2 eller mainnet.

## Framtida arbete

1. Decentraliserad dispute resolution
2. Fler opportunity typer
3. Faction system
4. Mer sofistikerad reputation med decay
5. On chain reputation snapshots för verifierbarhet
