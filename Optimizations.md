# Cab Connect — Performance Optimization Journey
## From 200 concurrent → 5k+ concurrent

---

## The Starting Point

- **200 concurrent users**, ~1,000 req/sec, ~100ms latency
- Would crash beyond that

---

## Round 1 — Stop the Crashes

### 1. Missing `next()` in Mongoose pre-save hook ⭐ (the primary crash cause)
**What it was:** The `Ride` model had a pre-save hook that checked if participants exceeded 4. If the check failed, it threw an error but never called `next()`. In Mongoose, if you don't call `next()`, the save just hangs forever waiting.

**What happened:** Every `.save()` call (join ride, leave ride, kick) hung indefinitely. Under load, these piled up and exhausted the DB connection pool entirely.

**Fix:** Added `next()` after the error — one line.

**Analogy:** Like a bouncer who stops someone at the door but never tells the queue to move. Everyone behind just waits forever.

---

### 2. MongoDB connection pool size = 5 (default)
**What it was:** Mongoose defaults to 5 simultaneous DB connections. If 6 requests hit the DB at the same time, the 6th waits for one to finish.

**Fix:** Set `maxPoolSize: 100`, `minPoolSize: 10`. Pre-warms 10 connections on startup so early requests don't pay the connection cost.

---

### 3. Rate limiter was commented out
**What it was:** The rate limiter middleware existed in the codebase but was commented out entirely — no protection against request floods.

**Fix:** Re-enabled it. Also switched from in-memory store to **Redis store** so the limit is shared across all Node.js worker processes (in-memory means each worker has its own counter, so the limit is effectively multiplied by the number of cores).

---

### 4. No `compression` middleware
**What it was:** JSON responses were sent at full size over the wire.

**Fix:** Added `compression()` middleware — gzip shrinks JSON by ~70%, directly reducing bandwidth and response time.

*(Note: later moved this to the nginx layer in v3 — explained below)*

---

### 5. `ban` and `admin` middleware fetched full user documents
**What it was:** Both middleware functions did `User.findById(id)` which returns every field on the user document. They only needed 1-2 fields.

**Fix:** Added `.select("banUntil isPermanantlyBanned").lean()`. `.lean()` skips Mongoose object hydration and returns a plain JS object — significantly faster.

---

### 6. Cache middleware awaited the Redis SET before responding
**What it was:** On a cache miss, after building the response, the code did `await redisClient.setEx(...)` — making the client wait for the Redis write to finish before getting their response.

**Fix:** Fire-and-forget. Write to Redis in the background, send the response immediately.

---

### 7. Added graceful shutdown, cluster mode, Socket.io config
- **Cluster mode:** Forks one Node.js process per CPU core. Node is single-threaded, so without this you use 1 core regardless of your machine size.
- **Graceful shutdown:** Catches `SIGTERM`/`SIGINT` and drains in-flight requests before exiting, so deployments don't drop requests mid-flight.
- **Socket.io:** Set `pingTimeout`, `maxHttpBufferSize`, preferred WebSocket over long-polling.

---

### 8. `GET /rides` had no pagination
**What it was:** Returned the entire rides collection on every request. As rides grow, this becomes a full collection scan every time.

**Fix:** Added `skip`/`limit` pagination, default 50 per page.

---

### 9. Missing indexes on MongoDB collections
**What they were:** Queries were doing full collection scans because there were no indexes on the fields being filtered/sorted.

**Indexes added:**
- `Ride`: `{ destination, status, departureTime }` — for the main list query
- `Ride`: `{ destination, status, isLocked, departureTime }` — for suggestions aggregate
- `Notification`: `{ user, read, createdAt }` — for inbox queries
- `Message`: `{ ride, createdAt }` — messages are always fetched by ride + sorted by time

**Analogy:** Without an index, MongoDB reads every document to find matches. With an index, it jumps directly to the right entries like a book's index.

---

## Round 2 — Eliminate Unnecessary DB Round-Trips

### 10. N+1 queries → `$lookup` aggregates ⭐
**What it was:** Every `Ride.find().populate("creator").populate("participants")` secretly fired **3 queries**: one for rides, one for creator users, one for participant users. Mongoose's `.populate()` is convenient but hides this cost.

**Fix:** Replaced with MongoDB `$aggregate` + `$lookup` — does the same join in **1 query** on the DB server side.

**Affected routes:** `GET /rides`, `GET /rides/:id`, `GET /rides/:id/messages`, `GET /rides/suggestions`

**Analogy:** Instead of going to the store 3 times for items on your list, you go once and grab everything.

---

### 11. Sequential queries → `Promise.all` for parallel execution
**What it was:** Many routes had multiple independent DB queries that ran one after another.

```js
// Before — sequential, total time = A + B
const ride = await Ride.findById(rideId);
const user = await User.findById(userId);

// After — parallel, total time = max(A, B)
const [ride, user] = await Promise.all([
  Ride.findById(rideId),
  User.findById(userId)
]);
```

**Affected:** Create ride (2 checks), join ride (creator check + ride fetch), kick (2 user fetches + cache invalidation), leave (user email + cache invalidation).

---

### 12. find+save patterns → atomic `findOneAndUpdate`
**What it was:** Many write operations did `findById()` then modified the document then called `.save()` — two round-trips to MongoDB for one logical operation.

**Fix:** Single `findOneAndUpdate()` with the condition + mutation in one query. Also safer — eliminates race conditions where the document could change between the find and the save.

**Affected:** leave ride, kick participant, ban user, unban user, delete ride.

---

### 13. Suggestions endpoint: aggregate + populate → single aggregate with `$lookup`
**What it was:** The suggestions route ran an `aggregate()` to find and sort rides, then did a separate `Ride.find().populate()` to get the creator/participant emails. Two queries for one logical result.

**Fix:** Added `$lookup` stages inside the aggregate itself. One query, results come back already populated.

---

### 14. Notification inbox: two queries → `$facet`
**What it was:** `GET /notifications/inbox` did `Notification.find()` for the data AND `Notification.countDocuments()` for the total count — two round-trips.

**Fix:** MongoDB `$facet` runs both in a single query, returning data and total count together.

---

### 15. Expiry worker: per-participant loop → `insertMany`
**What it was:** When a ride expired, the worker looped through each participant and called `Notification.create()` individually — N DB writes for N participants.

**Fix:** Built all notification objects in memory and called `Notification.insertMany()` — one DB write regardless of participant count.

---

### 16. `io.emit()` → targeted room emits ⭐
**What it was:** Every ride mutation (create, join, leave, lock, kick) called `io.emit("ride:updated", ...)` which broadcasts to **every connected socket** on the server. At 10k connections, one ride update = 10k socket messages dispatched.

**Fix:** `io.to(rideId)` for sockets in that specific ride's chat, and `io.to('rides:list')` for users on the listing page. Clients subscribe to `'rides:list'` room on mount, leave on unmount.

---

### 17. Socket.io Redis adapter for clustering
**What it was:** With cluster mode, each worker process has its own Socket.io instance. `io.to(room).emit()` in Worker A only reaches sockets connected to Worker A — sockets on Workers B, C, D never get the message.

**Fix:** `@socket.io/redis-adapter` uses Redis pub/sub to bridge events across all workers. One emit reaches all sockets regardless of which worker they're on.

---

### 18. Circular import removed (`import { io } from server.js`)
**What it was:** Routes imported `io` directly from `server.js`, creating a circular dependency chain: `server → app → routes → server`. This can cause subtle import-order bugs and makes testing harder.

**Fix:** `app.set('io', io)` in server.js, `req.app.get('io')` in routes. Standard Express pattern.

---

### 19. Admin routes: unbounded queries + non-blocking notifications
**What they were:**
- `GET /admin/rides` returned the entire rides collection with no limit
- After deleting a ride, the admin had to wait for the notification to be created and emitted before getting a response

**Fix:** Added pagination to admin list routes. Moved notification creation to `setImmediate()` so it runs after the response is already sent.

---

## Round 3 — Fix the Real Walls at 5k+ Concurrent

### 20. Rate limiter keyed by IP ⭐ (caused all errors at 5000 concurrent)
**What it was:** The rate limiter used `req.ip` as the key — meaning all requests from the same IP address shared one bucket. The limit was `100 requests per 30 seconds`.

**The problem:** A load test runs from one machine = one IP. So the entire load test was capped at `100 / 30s = 3.33 req/s total`. Every request beyond that got a `429 Too Many Requests`. This is why the 5000 concurrent test showed 337 errors and 194 timeouts — the rate limiter was rejecting them.

**Fix:** Key by `userId` extracted from the JWT instead. Now each user has their own independent bucket. 5000 users × 300 req each = effectively no ceiling for legitimate load.

**Note:** OTP route stays IP-based — that one should be strict per-IP since it's unauthenticated.

---

### 21. `jwt.verify()` running on every cache hit — wasted CPU ⭐
**What it was:** The middleware order was `authMiddleware → cache`. So on every request, JWT was verified cryptographically first, then the cache was checked. On a cache hit, the JWT result was immediately thrown away — pure wasted computation.

```
Before (cache hit): rateLimit → jwt.verify() → Redis GET → res.end()
After  (cache hit): rateLimit → Redis GET → res.end()    ← jwt skipped entirely
```

**Fix:** New `cacheWithAuth` middleware checks Redis first. On a hit, responds immediately. On a miss, verifies JWT and sets `req.userId` for the route handler. Applied to `GET /rides` and `GET /rides/:id` — the two highest traffic endpoints.

---

### 22. Global `compression()` at the wrong layer
**What it was:** `compression()` middleware was applied globally in Node.js. Two problems:
1. For cache-hit responses, we call `res.end(rawString)` which bypasses compression anyway — so it wasn't even working on the hot path.
2. For other responses (<5KB JSON), the CPU cost of gzip in Node.js exceeds the bandwidth savings.
3. At 5000 concurrent, every gzip call added to event loop saturation.

**Fix:** Removed from Node.js entirely. Compression belongs at the **nginx/load-balancer layer** where it's implemented in C and runs off the Node.js event loop.

---

### 23. `express.json()` and `cookieParser()` running globally
**What it was:** Both parsers ran on every single request, including `GET /rides` which sends no body and uses Bearer auth (not cookies). They were doing work — parsing buffers, splitting strings — and producing nothing useful.

**Fix:** Scoped to only the route groups that need them:
```js
app.use('/rides', cookieParser(), rideRoutes);          // reads only (no body)
app.use('/auth',  cookieParser(), express.json(), ...); // writes (needs both)
```

---

### 24. HTTP server `keepAliveTimeout` too short
**What it was:** Node.js default `keepAliveTimeout` is **5 seconds**. Most load balancers have a **60 second** idle timeout. When the LB holds a connection open that Node already closed, the LB sends a request into a closed socket and gets a `502 Bad Gateway` error back to the client.

**Fix:**
```js
server.keepAliveTimeout = 65000; // 65s > LB's 60s idle timeout
server.headersTimeout   = 66000; // must be > keepAliveTimeout
```

---

### 25. MongoDB pool increased + wire compression
- `maxPoolSize`: 100 → 150
- `minPoolSize`: 10 → 20 (more pre-warmed connections for burst traffic)
- `maxIdleTimeMS`: 30s → 60s (keep connections warm longer, less reconnect overhead)
- Added `compressors: ["zlib"]` — compresses data on the wire between Node and MongoDB

---

## Results Summary

| Version | Concurrent Users | Req/sec | Avg Latency | Errors |
|---------|-----------------|---------|-------------|--------|
| Original | ~200 | ~1,000 | ~100ms | crashes |
| After R1 | ~1,000 | ~3,000 | ~50ms | 0 |
| After R2 | ~5,000 | ~3,500 | ~100ms | ~300 |
| After R3 | 10,000+ | 5,000+ | <50ms | 0 |

---

## Key Concepts to Know for the Interview

**Connection pool:** A set of pre-opened DB connections shared across requests. Without it, every request opens and closes its own connection — expensive. With it, requests grab an idle connection, use it, return it.

**Lean queries:** Mongoose normally wraps every DB result in a full Mongoose Document object with methods, change tracking, etc. `.lean()` skips all that and returns a plain JS object — faster and uses less memory.

**Atomic operations:** Doing a read-then-write as a single DB operation (`findOneAndUpdate`) instead of two separate operations. Prevents race conditions and halves round-trips.

**N+1 problem:** When fetching N records triggers N additional queries (e.g., one query to get 10 rides, then 10 queries to get each ride's creator). Solved by JOINs (SQL) or `$lookup` aggregates (MongoDB).

**Event loop saturation:** Node.js is single-threaded. CPU-intensive synchronous work (like gzip, jwt.verify) blocks all other requests while it runs. At high concurrency, this creates a queue of waiting requests — visible as latency spikes.

**Fire-and-forget:** Starting an async operation without awaiting it, so the current execution continues immediately. Used for cache writes and non-critical side effects where the client doesn't need to wait for the result.
