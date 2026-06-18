## 2025-05-15 - [Database] Optimized Mention Lookup

**Learning:** Fetching the entire users table to filter mentions in-memory is an O(N) operation that scales poorly with user growth.
**Action:** Always perform filtering at the database level using `where: { name: { in: [...], mode: 'insensitive' } }` and limit returned fields with `select`.

## 2025-05-15 - [Mention Resolution Optimization]

**Learning:** Fetching all users from the database to resolve mentions (`prisma.user.findMany()`) is a significant bottleneck that scales linearly with the number of users. Replacing it with a targeted `in` query with `mode: 'insensitive'` and `select: { id: true, name: true }` avoids full table scans and reduces memory overhead.
**Action:** Always use targeted database queries with necessary filters and field selection instead of fetching full tables for lookup operations.

## 2025-05-15 - [Algorithmic] Optimized Mention ID Resolution

**Learning:** Using nested loops (O(N\*M)) for looking up user IDs from usernames in large messages or frequent operations causes CPU spikes.
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

## 2025-05-15 - [API/V10] Optimized Discord V10 Guild and Member Retrieval

**Learning:** Fetching full member lists with nested user objects to calculate counts or check single-user membership is a major O(N) bottleneck that causes memory spikes and latency in large workspaces.
**Action:** Use Prisma `select` with `_count` for totals and targeted `where` filters for specific membership checks. For presence counts, use a separate `prisma.model.count({ where: { ... } })` instead of filtering a large array in-memory.

## 2025-05-15 - [API] Consolidated Workspace Operations in InviteLinks

**Learning:** Sequential queries to resolve a workspace slug before performing operations on nested resources (like invite links) doubled the database RTT and increased latency.
**Action:** Use Prisma's nested `select` or `include` on a single `findUnique({ where: { slug } })` call to perform existence checks, membership authorization, and data retrieval in one round-trip.

## 2026-05-09 - [Database] Consolidated Workspace Authorization & Retrieval

**Learning:** Performing sequential Prisma queries for workspace existence, membership authorization, and data retrieval (logs, members, etc.) increases latency due to multiple database round-trips.
**Action:** Use Prisma's nested `select` or `include` with filtered relations on a single `findUnique({ where: { slug } })` call to perform all checks and data fetching in one round-trip. Re-map results in-memory if necessary to maintain API contracts.
## 2026-05-11 - [Database] Consolidated Workspace Data Retrieval
**Learning:** Sequential Prisma queries for workspace authorization and nested resource retrieval (channels, members) can be consolidated into a single 'findUnique' call using nested 'select' or 'include'.
**Action:** Always aim to fetch related resources and perform authorization checks in a single database round-trip for high-traffic workspace-scoped endpoints.

## 2025-05-20 - [Database] Optimized Team & Department Listing

**Learning:** Consolidated workspace lookup, membership authorization, and resource retrieval (teams/departments) into a single Prisma `findUnique` call using nested `select`. This pattern reduces database round-trips from 2 down to 1.
**Action:** For workspace-scoped listings, use nested relations in the initial workspace resolution query to avoid O(2) database RTT.

## 2025-05-18 - [API/Invitations] Consolidated Workspace Authorization & Invitation Retrieval

**Learning:** Sequential Prisma queries for workspace membership authorization and invitation retrieval (O(2)) can be consolidated into a single 'findUnique' call on the Workspace model using nested 'select'. This reduces database round-trips and allows for targeted field selection to minimize over-fetching.
**Action:** Always aim to fetch related resources and perform authorization checks in a single database round-trip for high-traffic workspace-scoped endpoints. Use targeted 'select' to minimize payload size and memory overhead.

## 2025-05-25 - [Prisma/Regressions] Select vs Include Data Contract
**Learning:** Switching from Prisma `include` to `select` for performance gains is risky because `select` is exclusive. Omitting nested fields (e.g., `role` in members, or metadata in announcements) causes silent API data regressions.
**Action:** When refactoring to `select`, meticulously map the existing `include` structure to ensure all nested fields are preserved. Use exhaustive unit tests to verify the response shape.

## 2025-05-28 - [API] Eliminated N+1 Queries in Active Calls Retrieval

**Learning:** Fetching channel access metadata inside a loop for each active call (N+1) in a workspace creates significant latency.
**Action:** Use batch fetching (Prisma 'in' operator) to retrieve all relevant channel data in a single secondary round-trip, and consolidate the initial workspace membership check to minimize database round-trips (RTT).

## 2025-05-28 - [Desktop/Tauri] Fixed Build Failure Due to Non-RGBA Icons

**Learning:** Tauri's  macro requires all icon assets to be in the RGBA format. Providing RGB-only PNGs causes a panic during the build process.
**Action:** Ensure all application icons are converted to RGBA using a tool like Pillow or sharp before bundling with Tauri.

## 2025-05-28 - [Desktop/Tauri] Fixed Build Failure Due to Non-RGBA Icons

**Learning:** Tauri's `generate_context!` macro requires all icon assets to be in the RGBA format. Providing RGB-only PNGs causes a panic during the build process.
**Action:** Ensure all application icons are converted to RGBA using a tool like Pillow or sharp before bundling with Tauri.

## 2025-05-30 - [API/Invitations] Parallelized Multi-Model Token Resolution

**Learning:** Sequential database lookups across different models (WorkspaceInviteLink, WorkspaceInvitation, Invitation) to resolve a single token create unnecessary latency (O(3) RTT).
**Action:** Use 'Promise.all' to fetch potential matches from all relevant models in parallel, then handle the results in priority order. This reduces database RTT from O(N) to O(1).

## 2026-05-27 - [Database] Reversing Query Direction for Entity Lookups
**Learning:** Querying a join table (e.g., `WorkspaceMember`) only to map back to the entity (e.g., `User`) is inefficient. It fetches unnecessary join-table columns and requires O(N) in-memory iteration to extract the desired objects.
**Action:** Query the target entity table directly using a relation filter (e.g., `prisma.user.findMany({ where: { workspaceMemberships: { some: { workspaceId } } } })`). Combine this with targeted `select` to minimize DB payload and eliminate in-memory mapping.

## 2026-05-30 - [API/Shared] Consolidated Notification Preference Retrieval
**Learning:** Sequential database queries for hierarchical notification preferences (Channel -> Workspace -> User) and N+1 lookups for global user preferences create significant latency and CPU overhead.
**Action:** Consolidate hierarchical preference lookups using parallelized queries with 'Promise.all' and eliminate N+1 patterns by pre-fetching all required User preferences in a single batch query.

## 2026-06-01 - [Database] Consolidated Multi-Entity Verification

**Learning:** When performing operations on a workspace-scoped entity (like a Department), sequential queries for workspace membership and entity existence can be consolidated into a single `prisma.workspace.findUnique` call using nested `select` with a `where` filter on the relation.
**Action:** Use nested relation filters in the workspace lookup to verify both membership and target entity existence in one database RTT.

## 2026-06-10 - [Prisma/Performance] Payload Reduction via Targeted Selection

**Learning:** Using Prisma `select` instead of `include` in high-traffic endpoints (like `getMessages` or `getMembers`) allows for explicit exclusion of `BigInt` fields (like `permissions`) and large internal metadata. This reduces JSON serialization overhead, avoids potential `BigInt` serialization errors when caching in Redis, and significantly shrinks the network payload size.
**Action:** Always use targeted `select` for endpoints that are cached or return large lists to minimize data transfer and serialization costs.

## 2026-06-05 - [API] Consolidating Writes with Nested Operations

**Learning:** Sequential existence checks followed by nested resource creation (e.g., sending a DM or creating a department announcement) can be consolidated using Prisma's `upsert` or `update` with nested `create`. This reduces database round-trips (RTT) and minimizes the window for race conditions.
**Action:** Use nested Prisma operations to combine verification and creation into a single round-trip. For resource-scoped writes, use `prisma.parent.update` with nested `create` instead of a separate `find` and `create`.

## 2026-06-05 - [Cache] Optimizing Cache Payload with Targeted Selection

**Learning:** Endpoints whose results are cached in Redis (e.g., channel lists) benefit significantly from switching from Prisma `include` to `select`. Broad `include` statements often pull in large relations or internal metadata that inflate the JSON payload, increasing serialization overhead and Redis memory footprint.
**Action:** Always use targeted `select` for high-traffic or cached endpoints to minimize the response size while strictly preserving the public API contract.

## 2026-06-10 - [API/Caching] Redis Caching & Audit Logging
**Learning:** Implementing Redis caching for API endpoints must not bypass security or audit logging. Caching operations should be wrapped in try-catch blocks to prevent 500 errors if Redis is unavailable (best-effort enhancement).
**Action:** Always call `auditService.log` before returning cached data and wrap Redis interactions in error handlers for graceful fallback to DB.

## 2026-06-12 - [Prisma/Performance] Prefer findUnique over findFirst
**Learning:** Using `prisma.model.findUnique` instead of `findFirst` when querying by primary keys (e.g., `id`) or compound unique indices (e.g., `workspaceId_userId` in `workspaceMember`) leverages direct database indexing for O(1) lookup performance. This reduces database CPU overhead and minimizes query execution time.
**Action:** Always prefer `findUnique` for lookup operations involving unique constraints to maximize performance.

## 2026-06-15 - [API/Calls] Optimized Call Initiation & Scheduling

**Learning:** Sequential Ably broadcasts and database lookups during call initiation or scheduling create significant latency, especially as the number of participants or workspace members grows (O(N) bottleneck).
**Action:** Consolidate workspace and membership resolution into a single Prisma query using nested `select`. Parallelize independent side effects (Ably events, notifications) using `Promise.all` or optimized batch delivery utilities like `createNotifications` to reduce total response time from O(N) to O(1) RTT.
