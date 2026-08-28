FROM node:22-alpine AS base

WORKDIR /app

# Copy package files first for better layer caching
COPY server/package*.json ./
COPY server/prisma ./prisma

# Install all dependencies (including dev for prisma generate + tsc)
RUN npm ci

# Copy config files
COPY server/tsconfig.json ./
COPY server/prisma.config.ts ./

# Copy source
COPY server/src ./src

# Generate Prisma client and compile TypeScript
# DATABASE_URL is needed by prisma.config.ts but only used at runtime for migrations
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN npx tsc

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache wget

WORKDIR /app

# Copy everything from base (smaller image = less important than working)
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/prisma.config.ts ./
COPY --from=base /app/package*.json ./

# Copy app.html for the web demo
COPY app.html ./app.html

ENV NODE_ENV=production

# Render inyecta PORT automáticamente. El server usa process.env.PORT ?? 4000.
# No fijamos PORT aquí para que Render pueda asignar el suyo.

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/v1/health || exit 1

# Run migration + start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
