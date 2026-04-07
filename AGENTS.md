# Agent Instructions

## Prisma Configuration
- Use Prisma v7.6.0.
- The Prisma client is generated to `packages/database/src/generated`.
- **Note:** The `src/generated` directory is excluded from version control. It is automatically generated during the install/build process via the `prepare` script.
- All applications should import `PrismaClient` and the `prisma` singleton from `@repo/database`.
- When generating the client, ensure `DATABASE_URL` is provided (even if it's a placeholder).

## Database Access
- The `@repo/database` package is the central point for database access.
- Use `pnpm --filter @repo/database db:generate` to update the client after schema changes.
