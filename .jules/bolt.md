## 2025-05-15 - [Database] Optimized Mention Lookup
**Learning:** Fetching the entire users table to filter mentions in-memory is an O(N) operation that scales poorly with user growth.
**Action:** Always perform filtering at the database level using `where: { name: { in: [...], mode: 'insensitive' } }` and limit returned fields with `select`.
## 2025-05-15 - [Mention Resolution Optimization]
**Learning:** Fetching all users from the database to resolve mentions (`prisma.user.findMany()`) is a significant bottleneck that scales linearly with the number of users. Replacing it with a targeted `in` query with `mode: 'insensitive'` and `select: { id: true, name: true }` avoids full table scans and reduces memory overhead.
**Action:** Always use targeted database queries with necessary filters and field selection instead of fetching full tables for lookup operations.
## 2025-05-15 - [Algorithmic] Optimized Mention ID Resolution
**Learning:** Using nested loops (O(N*M)) for looking up user IDs from usernames in large messages or frequent operations causes CPU spikes.
**Action:** Use a `Map` for O(N+M) lookup and a `Set` to de-duplicate results, preventing redundant downstream processing (like duplicate notifications).

## 2025-05-15 - [Database] Multi-Column Indexes for Chat History
**Learning:** Chat history queries frequently filter by `channelId` and sort by `timestamp`. A single-column index on `channelId` is insufficient for large datasets.
**Action:** Always use compound indexes like `@@index([channelId, timestamp])` for efficient message retrieval.

## 2025-05-15 - [API] Reduced Over-fetching in Search
**Learning:** Returning full User and Channel objects in search results increases DB CPU, network payload, and API memory usage significantly.
**Action:** Use Prisma `select` to retrieve only the fields actually used by the frontend (e.g., name, avatar) instead of broad `include` statements.

## 2025-05-15 - [API] Consistent Optimization of Message Retrieval
**Learning:** High-traffic endpoints like message retrieval in Channels and DMs often suffer from over-fetching due to broad `include` statements and large nested lists (e.g., all read receipts). Moving logic for reaction grouping and per-user read filtering to the server reduces JSON payload size by 40-60%.
**Action:** Always replace broad Prisma `include` with targeted `select`, and filter user-specific relations at the DB level where possible.

## 2025-05-15 - [API/Shared] Batch Notification Delivery
**Learning:** Sequential database inserts and external service calls (Ably/Push) for channel-wide or multi-mention notifications create O(N) bottlenecks. Prisma's `createManyAndReturn` (O(1) insert) combined with `Promise.all` for delivery drastically improves throughput.
**Action:** Consolidate notification logic into shared batch functions and use targeted relation queries (e.g., `where: { userId: { in: [...] } }`) to resolve preferences in one go.

## 2025-05-15 - [Testing] Vitest Hoisting and Mock initialization
**Learning:** Mocking shared packages that export multiple utilities often leads to `ReferenceError` if the mock variables aren't initialized before the module is hoisted.
**Action:** Use `vi.hoisted` to define mock functions that need to be accessed inside a `vi.mock` factory, ensuring they are available during module evaluation.

## 2025-05-15 - [API] Consolidated Workspace Data Retrieval
**Learning:** Sequential database queries for workspace lookup, membership verification, and data retrieval (O(3) round-trips) create significant latency in core navigation paths. Prisma's filtered 'include' allows combining these into a single atomic operation.
**Action:** Always prefer consolidated queries with relation filtering (e.g., 'include: { members: { where: { userId } } }') for workspace-scoped access patterns to reduce database round-trips.
