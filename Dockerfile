FROM node:22-alpine AS base

# Prisma needs libc6-compat and openssl on Alpine
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# Copy prisma schema because postinstall runs prisma generate
COPY prisma ./prisma/

# UPDATED: Added --dangerously-allow-all-builds to bypass pnpm v10 security blocks
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Build the app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set necessary environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client (just in case, though postinstall should have handled it)
RUN pnpm prisma generate

# Build application
RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a system user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Prisma CLI globally for migrations
RUN pnpm add -g prisma@6.5.0

# 1. Copy built files and apply ownership inline to avoid OOM errors
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
