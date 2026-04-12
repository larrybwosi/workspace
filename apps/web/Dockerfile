FROM node:22-alpine AS base

# Prisma needs libc6-compat and openssl on Alpine
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS builder
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune web --docker

FROM base AS installer
WORKDIR /app

# First copy the pruned lockfile and package.json
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile --dangerously-allow-all-builds

# Build the project
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# Generate Prisma Client
RUN npx turbo run db:generate

RUN npx turbo build --filter=web... -- --webpack

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a system user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install Prisma globally for migrations
RUN pnpm add -g prisma@7.6.0

# Set up pnpm and prisma engines (as seen in original Dockerfile)
RUN chown -R nextjs:nodejs /pnpm

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/packages/database/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Note: server.js in standalone mode is at apps/web/server.js usually,
# but turbo prune + standalone might put it at the root of standalone output.
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "apps/web/server.js"]
