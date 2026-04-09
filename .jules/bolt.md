## 2025-05-15 - [Mention Resolution Optimization]
**Learning:** Fetching all users from the database to resolve mentions (`prisma.user.findMany()`) is a significant bottleneck that scales linearly with the number of users. Replacing it with a targeted `in` query with `mode: 'insensitive'` and `select: { id: true, name: true }` avoids full table scans and reduces memory overhead.
**Action:** Always use targeted database queries with necessary filters and field selection instead of fetching full tables for lookup operations.
