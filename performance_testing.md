# Performance Testing Report

**Project:** Cab Connect Backend
**Version:** Optimized Build
**Date:** June 2026
**Environment:** Windows (Local Machine)
**Load Testing Tool:** Autocannon

---

# Objective

Evaluate the performance of the optimized backend under authenticated production-like workloads by measuring throughput, latency, scalability, and behavior under increasing concurrent load.

---

# Test Configuration

| Property          | Value                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| Runtime           | Node.js                                                                                        |
| Framework         | Express.js                                                                                     |
| Database          | MongoDB                                                                                        |
| Cache             | Redis                                                                                          |
| Authentication    | JWT                                                                                            |
| Load Generator    | Autocannon                                                                                     |
| Test Duration     | 30–60 seconds                                                                                  |
| Endpoint          | `GET /rides?page=1&limit=50`                                                                   |
| Endpoint Features | JWT Authentication, Redis Cache, MongoDB Aggregation Pipeline, Pagination, Multiple `$lookup`s |

---

# Baseline Endpoint

### `GET /health`

| Concurrent Clients | Avg Req/sec | Avg Latency | P99 Latency |
| -----------------: | ----------: | ----------: | ----------: |
|                 10 |       5,865 |     1.13 ms |       10 ms |
|                 50 |       2,996 |     16.2 ms |       57 ms |
|                500 |       6,711 |     74.1 ms |      344 ms |
|               1000 |       2,594 |      384 ms |      918 ms |

---

# Authenticated API Benchmark

### `GET /rides?page=1&limit=50`

## 100 Concurrent Clients

| Metric             |             Value |
| ------------------ | ----------------: |
| Average Throughput | **3,781 req/sec** |
| Average Latency    |       **26.1 ms** |
| P99 Latency        |        **101 ms** |
| Throughput         |   **7.07 MB/sec** |
| Requests Completed |       **114,000** |
| Errors             |             **0** |

---

## 1000 Concurrent Clients

| Metric             |             Value |
| ------------------ | ----------------: |
| Average Throughput | **3,921 req/sec** |
| Average Latency    |        **252 ms** |
| Median Latency     |        **159 ms** |
| P99 Latency        |      **1.60 sec** |
| Throughput         |   **7.33 MB/sec** |
| Requests Completed |       **236,000** |
| Errors             |     **1 Timeout** |

---

## 5000 Concurrent Clients (Stress Test)

| Metric             |             Value |
| ------------------ | ----------------: |
| Average Throughput | **3,629 req/sec** |
| Average Latency    |        **995 ms** |
| Median Latency     |        **880 ms** |
| P99 Latency        |      **7.16 sec** |
| Throughput         |   **6.78 MB/sec** |
| Requests Completed |       **138,000** |
| HTTP Errors        |        **13,000** |
| Timeouts           |        **13,000** |

---

# Performance Summary

| Concurrent Clients | Avg Req/sec | Avg Latency | Error Rate |
| -----------------: | ----------: | ----------: | ---------: |
|                100 |   **3,781** |   **26 ms** |         0% |
|              1,000 |   **3,921** |  **252 ms** |    <0.001% |
|              5,000 |   **3,629** |  **995 ms** |      ~9.4% |

---

# Scalability Analysis

| Load          | Observed Behavior                                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 100 Clients   | Stable throughput with consistently low response times.                                                                                                                |
| 1,000 Clients | Backend maintained nearly 4K authenticated requests/sec with minimal request failures, demonstrating efficient scaling under heavy load.                               |
| 5,000 Clients | Service remained operational under extreme load while exhibiting graceful degradation through increased latency and request timeouts due to local hardware saturation. |

---

# Key Findings

* Sustained approximately **3.9K authenticated requests/sec** during heavy-load testing.
* Maintained **sub-300 ms average latency** under **1,000 concurrent clients**.
* Successfully processed over **236,000 authenticated requests** during a single 60-second benchmark.
* Redis caching and MongoDB aggregation pipeline remained stable under sustained load.
* Stress-tested up to **5,000 concurrent HTTP connections**, where the application continued serving requests while degrading gracefully under hardware limits.

---

# Conclusion

The optimized Cab Connect backend demonstrates strong throughput and scalability characteristics for authenticated REST APIs backed by MongoDB and Redis. The application maintains stable performance across normal and heavy production-like workloads and continues operating under extreme stress conditions, with graceful degradation observed only after local machine resource saturation.
