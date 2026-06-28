# Performance Testing Report

**Project:** Cab Connect Backend
**Date:** June 2026
**Testing Tool:** Autocannon
**Environment:** Windows (Local Development Machine)

---

# Overview

This report summarizes the HTTP performance evaluation conducted on the Cab Connect backend after performance optimizations. The objective was to measure throughput, latency, and system behavior under increasing concurrent load.

---

# Test Configuration

| Parameter                | Value                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| Framework                | Express.js                                                                            |
| Runtime                  | Node.js                                                                               |
| Database                 | MongoDB                                                                               |
| Cache                    | Redis                                                                                 |
| Authentication           | JWT                                                                                   |
| Load Generator           | Autocannon                                                                            |
| Test Duration            | 30–60 seconds                                                                         |
| Target Endpoint          | `GET /rides?page=1&limit=50`                                                          |
| Endpoint Characteristics | JWT Authentication, Redis Cache, MongoDB Aggregation, Pagination, Multiple `$lookup`s |

---

# Baseline Endpoint

**Endpoint**

```http
GET /health
```

| Concurrent Clients | Avg Req/sec | Avg Latency | P99 Latency |
| -----------------: | ----------: | ----------: | ----------: |
|                 10 |       5,865 |     1.13 ms |       10 ms |
|                 50 |       2,996 |     16.2 ms |       57 ms |
|                500 |       6,711 |     74.1 ms |      344 ms |
|               1000 |       2,594 |      384 ms |      918 ms |

---

# Authenticated Endpoint Benchmark

**Endpoint**

```http
GET /rides?page=1&limit=50
```

Authentication: Bearer JWT

Caching: Redis

Database: MongoDB Aggregation Pipeline

---

## Test 1 — 100 Concurrent Clients

| Metric             |            Result |
| ------------------ | ----------------: |
| Average Throughput | **3,995 req/sec** |
| Average Latency    |      **24.63 ms** |
| P99 Latency        |         **61 ms** |
| Data Throughput    |   **7.63 MB/sec** |
| Requests Completed |       **120,000** |
| Errors             |             **0** |

---

## Test 2 — 1000 Concurrent Clients

| Metric             |            Result |
| ------------------ | ----------------: |
| Average Throughput | **2,804 req/sec** |
| Average Latency    |     **347.89 ms** |
| Median Latency     |        **260 ms** |
| P99 Latency        |      **3.02 sec** |
| Data Throughput    |   **5.36 MB/sec** |
| Requests Completed |       **169,000** |
| Errors             |             **0** |

---

## Test 3 — 5000 Concurrent Clients

| Metric             |            Result |
| ------------------ | ----------------: |
| Average Throughput | **1,914 req/sec** |
| Average Latency    |      **2.60 sec** |
| Median Latency     |      **2.11 sec** |
| P99 Latency        |      **9.62 sec** |
| Data Throughput    |   **3.66 MB/sec** |
| Requests Completed |       **111,000** |
| HTTP Errors        |           **337** |
| Request Timeouts   |           **194** |

---

# Performance Characteristics

| Concurrent Clients | Avg Req/sec | Avg Latency | Error Rate | Assessment                                  |
| -----------------: | ----------: | ----------: | ---------: | ------------------------------------------- |
|                100 |      ~4,000 |     24.6 ms |         0% | Stable                                      |
|              1,000 |      ~2,800 |      348 ms |         0% | Stable under heavy load                     |
|              5,000 |      ~1,900 |       2.6 s |      <0.4% | System saturation with graceful degradation |

---

# Key Observations

* The backend maintained approximately **4,000 authenticated requests per second** while keeping average latency below **25 ms**.
* Under **1,000 concurrent clients**, request processing remained stable with no observed failures.
* At **5,000 concurrent connections**, throughput remained above **1,900 requests/sec** while latency increased significantly, indicating CPU and event-loop saturation on the local development environment.
* Even under saturation, the service continued processing requests rather than failing completely, exhibiting graceful degradation characteristics.

---

# Conclusion

The optimized backend demonstrates strong throughput characteristics for authenticated REST APIs backed by MongoDB and Redis.

The system performs reliably under normal and heavy production-like loads, with the practical operating point observed around **100–1,000 concurrent clients** on local hardware. Stress testing at **5,000 concurrent connections** confirmed graceful degradation under extreme load while continuing to serve requests.
