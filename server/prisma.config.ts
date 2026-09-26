import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * `url` is intentionally not resolved with Prisma's `env()` helper: `prisma
 * generate` runs during the Vercel build and on a clean checkout, where no
 * database credentials should be required. Migrate commands are only ever run
 * with DATABASE_URL exported (see `npm run db:migrate:deploy`), so the fallback
 * is unreachable in practice — it only keeps codegen hermetic.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx tsx src/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/shopping_optimizer',
  },
});
