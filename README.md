# SHYFTEX

An intelligent mobile application that transforms a shopping list into the optimal purchasing strategy.

**"Sube tu lista. Nosotros encontramos la mejor manera de comprarla."**

## What It Does

The app takes a user's shopping list and calculates the **best strategy** to buy all items, considering:

- Product prices across multiple stores
- Current promotions and discounts
- Product availability
- User's location and transportation
- Fuel costs and travel time
- User preferences and constraints
- Budget limitations

## Architecture

```
src/
├── app/                  # Expo Router screens
├── domain/               # Core business logic (no external deps)
│   ├── entities/         # Domain entities
│   ├── valueObjects/     # Money, Price
│   └── interfaces/       # Provider port interfaces
├── optimization/         # Optimization engine (pure TypeScript)
├── infrastructure/       # External implementations
│   └── providers/        # Mock data providers
├── stores/               # Zustand state management
├── hooks/                # React hooks
├── components/           # UI components
├── config/               # Theme, constants
├── lib/                  # Utilities
server/                   # Fastify backend API
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo (TypeScript) |
| Navigation | Expo Router |
| State | Zustand |
| Backend | Fastify + Node.js |
| Database | PostgreSQL + Prisma (planned) |
| Testing | Jest |
| Build | Docker |

## Quick Start

### Mobile App
```bash
npm install
npx expo start
```

### Backend API
```bash
cd server
npm install
npm run dev
```

## Key Features

- **Natural language list parsing** — Type your list in Spanish
- **Product normalization** — Matches "Leche Lala 1L" and "Lala leche entera 1 litro"
- **Multi-store optimization** — Finds the best combination of stores
- **Promotion engine** — Applies 2x1, 3x2, percentage discounts, card promotions
- **Transport calculation** — Fuel costs, driving time, route optimization
- **Shopping mission** — Step-by-step guide during actual shopping
- **Explanation engine** — Every recommendation answers "Why?"

## Testing

```bash
npm test           # Run all tests
npx tsc --noEmit   # Type check
```

112+ tests covering:
- Money value object (precision, arithmetic)
- Shopping item logic
- Optimization engine (constraints, promotions, multi-store)

## Demo Mode

The app includes a demo mode with realistic Mexican retail data (Walmart, Soriana, Bodega Aurrera, Costco, Chedraui). All mock data is clearly marked and never presented as real.

## Environment Variables

See `.env.example` for all configuration options.

## Security

- No hardcoded secrets
- JWT authentication
- Input validation
- Rate limiting
- Row-level authorization
- Secure token handling

## Documentation

- `IMPLEMENTATION_PLAN.md` — Architecture and phases
- `DECISIONS.md` — Architectural decisions
- `AGENTS.md` — Project rules for AI agents
