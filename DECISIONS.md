# ARCHITECTURAL DECISIONS

## D001: Monorepo with Clean Architecture
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need a maintainable codebase for a complex application with optimization engine, multiple data providers, and mobile frontend.
**Decision:** Use a single repository with strict module boundaries following Clean Architecture. Domain layer has zero external dependencies. Infrastructure implements domain interfaces.
**Consequences:** 
+ Single deployment unit for backend
+ Shared type definitions
+ Domain logic fully testable without infrastructure
- Requires discipline to maintain boundaries

## D002: React Native + Expo over Flutter
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need cross-platform mobile app. Environment has Node.js but no Flutter/Dart/Java SDK.
**Decision:** Use React Native with Expo (managed workflow) and TypeScript.
**Consequences:**
+ TypeScript shared with backend
+ Expo handles iOS/Android builds via EAS
+ Large ecosystem of packages
+ No Flutter/Dart installation needed
- Expo managed workflow limits some native modules
- JS runtime performance vs native (acceptable for this use case)

## D003: Fastify over Express
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need a performant, type-safe backend.
**Decision:** Use Fastify with TypeScript.
**Consequences:**
+ ~2x faster than Express
+ Built-in JSON schema validation
+ Better TypeScript support
+ Plugin architecture
- Smaller ecosystem than Express (but sufficient)

## D004: Prisma over raw SQL/TypeORM
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need a relational database with migrations and type safety.
**Decision:** Use Prisma ORM with PostgreSQL.
**Consequences:**
+ Auto-generated TypeScript types
+ Excellent migration system
+ Good DX with Prisma Studio
+ Type-safe queries
- Migration to other ORMs later would be costly
- Some complex queries may need raw SQL (Prisma supports this)

## D005: Decimal precision for money
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Monetary calculations must be precise. Floating point is unacceptable.
**Decision:** Represent money as integer cents internally. Display as formatted decimal strings. Use a Money value object.
**Consequences:**
+ No floating point rounding errors
+ Deterministic calculations
- All monetary operations go through Money type

## D006: Mock providers from day one
**Date:** 2026-08-19
**Status:** Accepted
**Context:** No real retail APIs are publicly available for Mexican stores.
**Decision:** Every external provider has interface + mock implementation. Mock data is clearly flagged. Real providers can be swapped in without changing domain logic.
**Consequences:**
+ Development can proceed without external dependencies
+ Clear contract for future integrations
+ Mock data is realistic but never presented as real
- Mock data needs to be maintained

## D007: Backend-first critical calculations
**Date:** 2026-08-19
**Status:** Accepted
**Context:** The spec requires that financial calculations, optimization, and promotions are deterministic and secure.
**Decision:** All critical business logic runs on the backend. Frontend displays results and handles UI state only.
**Consequences:**
+ Security: business rules can't be tampered with
+ Consistency: single source of truth for calculations
+ Testability: backend logic is independently testable
- More backend calls (mitigated by caching)

## D008: Zustand over Redux
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need client-side state management for mobile app.
**Decision:** Use Zustand for state management.
**Consequences:**
+ Less boilerplate than Redux
+ Better performance
+ Simple API
+ Works well with React Native
- Less ecosystem than Redux (but sufficient)

## D009: Optimization algorithm strategy
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need to find optimal shopping strategy across multiple stores.
**Decision:** Start with a scoring-based heuristic approach. Evaluate combinations of stores, assign scores across dimensions (cost, time, distance, convenience). Use dominance pruning to reduce search space. Evolve to more sophisticated algorithms (branch and bound, dynamic programming) as needed.
**Consequences:**
+ Fast enough for real-time use
+ Produces good-enough results for most cases
+ Can be incrementally improved
- Not guaranteed optimal in all cases (acceptable with explanations)

## D010: Expo Router for navigation
**Date:** 2026-08-19
**Status:** Accepted
**Context:** Need type-safe, deep-linkable navigation.
**Decision:** Use Expo Router (file-based routing).
**Consequences:**
+ File-based, convention over configuration
+ Deep linking works automatically
+ Better than React Navigation for new projects
+ Good TypeScript support
- Relatively new (but stable enough)
