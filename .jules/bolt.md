## 2025-05-15 - [Database] Optimized Mention Lookup
**Learning:** Fetching the entire users table to filter mentions in-memory is an O(N) operation that scales poorly with user growth.
**Action:** Always perform filtering at the database level using `where: { name: { in: [...], mode: 'insensitive' } }` and limit returned fields with `select`.
## 2025-05-15 - [Mention Resolution Optimization]
**Learning:** Fetching all users from the database to resolve mentions (`prisma.user.findMany()`) is a significant bottleneck that scales linearly with the number of users. Replacing it with a targeted `in` query with `mode: 'insensitive'` and `select: { id: true, name: true }` avoids full table scans and reduces memory overhead.
**Action:** Always use targeted database queries with necessary filters and field selection instead of fetching full tables for lookup operations.
