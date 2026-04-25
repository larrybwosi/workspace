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
RUN turbo prune api --docker

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

RUN npx turbo build --filter=api...

FROM base AS runner
WORKDIR /app

# Create a system user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Install Prisma globally for migrations
RUN pnpm add -g prisma@7.6.0

# Set up pnpm and prisma engines (as seen in original Dockerfile)
RUN chown -R nestjs:nodejs /pnpm

WORKDIR /app

COPY --from=installer --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=installer --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=installer --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/package.json ./package.json
COPY --from=installer --chown=nestjs:nodejs /app/packages/database/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/docker-entrypoint.sh ./

RUN chmod +x ./docker-entrypoint.sh

USER nestjs

EXPOSE 3000

ENV PORT=3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main"]
