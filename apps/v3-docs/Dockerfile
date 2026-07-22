FROM node:22-alpine AS base

# Install requirements
RUN apk add --no-cache libc6-compat openssl

# Install pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS builder
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
RUN turbo prune --scope=v3-docs --docker

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

# Build the static docs
RUN npx turbo build --filter=v3-docs

FROM base AS runner
WORKDIR /app

# Create a system user to run the app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 staticuser

# Serve using sirv-cli
RUN pnpm add -g sirv-cli

COPY --from=installer /app/apps/v3-docs/dist ./dist

USER staticuser

EXPOSE 3006

ENV PORT=3006

CMD ["sirv", "dist", "--port", "3006", "--host", "0.0.0.0", "--single"]
