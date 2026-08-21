# IMPLEMENTATION PLAN
## Intelligent Shopping Optimizer

---

## 1. ARCHITECTURE OVERVIEW

### Product
A **mobile-first application** that takes a shopping list from a user and produces the **optimal purchasing plan** considering products, prices, promotions, availability, stores, distance, transportation, fuel, time, budget, preferences, and uncertainty.

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Mobile** | React Native + Expo (TypeScript) | Cross-platform (iOS+Android), Expo for build/OTA, strong TS support |
| **Navigation** | Expo Router (file-based) | Modern, type-safe, deep linking |
| **State** | Zustand | Lightweight, performant, no boilerplate |
| **Backend** | Node.js + Fastify | High performance, TypeScript native, lightweight |
| **Database** | PostgreSQL + Prisma ORM | Relational model, migrations, type-safe queries |
| **Cache** | Redis | Session, rate limiting, data caching |
| **Auth** | Custom JWT + bcrypt | No external auth dependency, full control |
| **Maps** | Provider abstraction (Google/OSM) | No vendor lock-in |
| **AI/OCR** | Provider abstraction (OpenAI/Local) | Swappable providers |
| **Testing** | Jest + React Native Testing Library | Unit, integration, E2E |
| **Deployment** | Docker + Docker Compose | Portable, reproducible |

### Why NOT other options
- **Flutter**: Not installed in this environment, would add significant setup time
- **Supabase**: Good for rapid prototyping but limits optimization engine flexibility
- **Firebase**: Vendor lock-in, limited relational queries for complex optimization
- **Expo Go + managed workflow**: Limits native modules needed for maps, OCR, etc.

### Architecture Pattern
**Clean Architecture** with clear separation:
- **Presentation** → Screens, components, hooks
- **Application** → Use cases, workflows
- **Domain** → Entities, value objects, business rules
- **Infrastructure** → Database, external services, providers

```
src/
├── app/                  # Expo Router screens (Presentation)
├── components/           # Reusable UI components
├── stores/               # Zustand stores
├── domain/               # Core business logic (NO external deps)
│   ├── entities/         # Domain entities
│   ├── valueObjects/     # Price, Money, etc.
│   ├── services/         # Domain services
│   └── interfaces/       # Port interfaces
├── application/          # Use cases / orchestration
├── infrastructure/       # External implementations
│   ├── database/         # Prisma, repositories
│   ├── providers/        # External service adapters
│   ├── api/              # HTTP client
│   └── cache/            # Redis
├── ai/                   # AI/NLP modules (separate from core logic)
├── optimization/         # Optimization engine (pure functions)
├── lib/                  # Shared utilities
└── config/               # Environment, constants
```

---

## 2. KEY ARCHITECTURAL DECISIONS

### D001: Monorepo with shared domain
- Single repo with clear module boundaries
- Domain layer has ZERO external dependencies
- Infrastructure implements domain interfaces

### D002: Mock providers from day one
- Every external provider has interface + mock implementation
- Mock data is clearly marked as MOCK
- Can swap to real providers without changing domain

### D003: Optimization engine is pure TypeScript
- No database calls, no network calls
- Input: data structures → Output: ranked plans
- Exhaustively testable with synthetic data

### D004: Backend-first critical calculations
- Product cost, promotion application, transport calculation — ALL on backend
- Frontend displays results, never computes critical values

### D005: Decimal precision for money
- Use string-based or integer-cents representation
- Never use floating point for monetary calculations

### D006: Provider abstraction mandatory
- `RetailDataProvider`, `FuelPriceProvider`, `MapProvider`, etc.
- Each has interface + mock + (future) real implementation
- Optimization engine depends only on interfaces

---

## 3. DATABASE SCHEMA (simplified)

### Core Entities
- **User** — id, email, passwordHash, name, preferences, createdAt
- **Vehicle** — id, userId, make, model, year, fuelType, customEfficiency
- **ShoppingList** — id, userId, title, rawInput, status, createdAt
- **ShoppingItem** — id, listId, rawName, normalized, category, brand, quantity, unit, priority, isRequired, allowsSubstitution
- **Product** — id, name, canonicalName, brand, category, barcodes
- **Retailer** — id, name, logo, website
- **Store** — id, retailerId, name, address, lat, lng, phone, hours
- **StoreProduct** — id, storeId, productId, sku, barcode, price, salePrice, currency, source, confidence, observedAt
- **Promotion** — id, storeId, retailerId, type, description, conditions, validFrom, validUntil, applicableProducts, cardRequired, membershipRequired
- **Inventory** — id, storeProductId, status, lastChecked, source, confidence
- **ShoppingPlan** — id, userId, listId, mode, totalProductCost, totalTransportCost, totalTime, totalDistance, effectiveTotalCost, estimatedSavings, confidence, stores, route, explanation
- **ShoppingMission** — id, planId, userId, status, startedAt, completedAt
- **ShoppingMissionItem** — id, missionId, storeId, productId, status, substitutionId, notes
- **PurchaseHistory** — id, userId, planId, storeId, productId, pricePaid, quantity, purchasedAt
- **SavingsRecord** — id, userId, planId, baselineCost, recommendedCost, netSavings, savedAt

### Indexes
- User: email (unique)
- Store: retailerId, lat/lng
- StoreProduct: storeId, productId, barcode
- Promotion: storeId, validFrom/validUntil
- ShoppingPlan: userId, createdAt
- ShoppingMission: userId, status
- PurchaseHistory: userId, productId, purchasedAt

---

## 4. API ENDPOINTS (v1)

### Auth
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### Lists
- `GET /api/v1/lists`
- `POST /api/v1/lists`
- `POST /api/v1/lists/parse` — Parse raw text into structured items
- `GET /api/v1/lists/:id`
- `PUT /api/v1/lists/:id`
- `DELETE /api/v1/lists/:id`

### Products
- `GET /api/v1/products/search`
- `GET /api/v1/products/:id`

### Stores
- `GET /api/v1/stores/nearby?lat=&lng=&radius=`
- `GET /api/v1/stores/:id`
- `GET /api/v1/stores/:id/products`

### Optimization
- `POST /api/v1/optimize` — Generate shopping plans
- `GET /api/v1/plans/:id`

### Mission
- `POST /api/v1/missions` — Start mission from plan
- `PUT /api/v1/missions/:id/items/:itemId` — Mark item status
- `POST /api/v1/missions/:id/recalculate`
- `GET /api/v1/missions/:id`

### History
- `GET /api/v1/history/purchases`
- `GET /api/v1/history/savings`

### Preferences
- `GET /api/v1/preferences`
- `PUT /api/v1/preferences`
- `GET /api/v1/vehicles`
- `POST /api/v1/vehicles`

---

## 5. PHASES

### Phase 0: Environment Audit ✅
- Inspect available tools
- Determine tech stack

### Phase 1: Architecture & Planning
- Create IMPLEMENTATION_PLAN.md
- Create DECISIONS.md
- Create AGENTS.md
- Design database schema

### Phase 2: Project Scaffolding
- Initialize Expo project
- Set up folder structure
- Configure TypeScript, ESLint, Prettier
- Install dependencies
- Create design tokens

### Phase 3: Domain Models & Database
- Define all domain entities in TypeScript
- Create Prisma schema
- Create database migrations
- Implement value objects (Money, Price, etc.)

### Phase 4: Backend Foundation
- Set up Fastify server
- Create API structure
- Implement auth endpoints
- Create middleware (auth, validation, error handling)

### Phase 5: Shopping Lists
- List CRUD operations
- Text parsing engine (NLP)
- Product normalization
- Item categorization

### Phase 6: Retail/Product Data
- Provider abstraction layer
- Mock retail data provider
- Store search
- Product search
- Store detail

### Phase 7: Promotions & Pricing
- Promotion engine (types, conditions, evaluation)
- Price aggregation
- Promotion calculator
- Effective price computation

### Phase 8: Transportation
- Transport provider abstraction
- Vehicle registration & efficiency
- Fuel cost calculation
- Route calculation abstraction
- Public transport estimation

### Phase 9: Optimization Engine
- Optimization modes (savings, balanced, convenience)
- Multi-store strategy evaluation
- Route optimization
- Constraint satisfaction
- Plan generation with explanations

### Phase 10: Plan Presentation
- Plan screens
- Plan comparison
- Route visualization
- Store breakdown
- Savings explanation

### Phase 11: Shopping Mission
- Mission start
- Checklist management
- Item availability handling
- Real-time recalculation
- Mission completion

### Phase 12: History & Analytics
- Purchase recording
- Savings dashboard
- Spending analytics
- Recurring list suggestions

### Phase 13: AI Features
- List parsing with NLP
- Product normalization
- Substitution suggestions
- Explanation generation

### Phase 14: Notifications & Opportunities
- Notification system
- Price drop detection
- Recurring list reminders
- Deal opportunities

### Phase 15: UI/UX Polish
- Design system
- Animations
- Empty states
- Loading states
- Error states
- Accessibility

### Phase 16: Testing
- Unit tests for domain logic
- Integration tests for APIs
- Optimization engine tests (exhaustive)
- Component tests
- E2E flow tests

### Phase 17: Security
- Input validation
- Rate limiting
- SQL injection prevention
- XSS prevention
- Secret management
- Row-level authorization

### Phase 18: Performance
- Bundle optimization
- Image optimization
- Cache strategy
- Database query optimization
- Lazy loading

### Phase 19: Deployment
- Docker configuration
- Environment setup
- Database migrations
- Health checks
- Monitoring

### Phase 20: Final Audit
- Security checklist
- Performance audit
- UX audit
- Code quality audit
- Documentation completeness

---

## 6. MOCK DATA

### Retailers (Mexico)
1. Walmart (Walmart de México)
2. Soriana
3. Bodega Aurrera
4. Costco
5. La Comer
6. Chedraui
7. Superama (now Walmart Express)
8. HEB
9. Circle K (convenience)
10. OXXO (convenience)

### Products (sample ~100)
- Dairy, produce, meat, bakery, beverages, cleaning, personal care, household
- Real Mexican brands (Lala, Bimbo, Coca-Cola, Ariel, etc.)

### Promotions (sample ~20)
- 2x1, 3x2, percentage discount, loyalty pricing, card promotions
- Real Mexican retailer promotion types

---

## 7. RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| No real retail API available | Data accuracy | Mock providers with realistic data, clear MOCK marking |
| Optimization complexity | Performance | Start with greedy, evolve to smarter algorithms |
| Map integration | Cost | Abstract provider, start with OpenStreetMap |
| Scope creep | Timeline | Follow phases strictly, core loop first |
| Mobile builds | Setup time | Use Expo managed workflow, EAS Build |

---

## 8. DEFINITION OF DONE (per phase)

After each phase:
1. All tests pass
2. TypeScript compiles without errors
3. Linting passes
4. Build succeeds
5. No regressions from previous phases
6. Documentation updated
