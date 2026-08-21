FROM node:22-alpine AS base

WORKDIR /app

# Copy package files first for better layer caching
COPY server/package*.json ./
COPY server/prisma ./prisma

# Install all dependencies (including dev for prisma generate)
RUN npm ci

# Copy config files
COPY server/tsconfig.json ./
COPY server/prisma.config.ts ./

# Copy source
COPY server/src ./src

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npx tsc

# Production stage
FROM node:22-alpine AS production

RUN apk add --no-cache wget

WORKDIR /app

# Create non-root user
RUN addgroup -S shyftex && adduser -S shyftex -G shyftex

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/prisma.config.ts ./
COPY --from=base /app/package*.json ./

# Copy app.html for the web demo
COPY app.html ./app.html

# Set ownership
RUN chown -R shyftex:shyftex /app

USER shyftex

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

# Run migration + start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
