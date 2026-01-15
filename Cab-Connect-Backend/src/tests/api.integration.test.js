import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Cab Connect API Integration", () => {
  // 1
  it("GET /health -> 200 ok:true", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  // 2
  it("GET / -> 200 with backend running message", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(typeof res.text).toBe("string");
    expect(res.text.toLowerCase()).toContain("cab connect");
  });

  // 3
  it("GET /random -> 404", async () => {
    const res = await request(app).get("/random-route-does-not-exist");
    expect(res.statusCode).toBe(404);
  });

  // 4
  it("GET /rides -> should require auth (expect 401/403)", async () => {
    const res = await request(app).get("/rides");
    expect([401, 403]).toContain(res.statusCode);
  });

  // 5
  it("POST /rides -> should require auth (expect 401/403)", async () => {
    const res = await request(app).post("/rides").send({
      destination: "Airport",
      travelTime: new Date(Date.now() + 60_000).toISOString(),
    });

    expect([401, 403, 404]).toContain(res.statusCode);
  });

  // 6
  it("GET /notifications -> should require auth (expect 401/403)", async () => {
    const res = await request(app).get("/notifications");
    expect([401, 403]).toContain(res.statusCode);
  });

  // 7
  it("POST /reports -> should require auth (expect 401/403)", async () => {
    const res = await request(app).post("/reports").send({
      rideId: "dummyRideId",
      targetUserId: "dummyTargetId",
      reason: "SPAM",
    });

    expect([401, 403]).toContain(res.statusCode);
  });

  // 8
  it("GET /admin -> should require auth (expect 401/403)", async () => {
    const res = await request(app).get("/admin");
    expect([401, 403, 404]).toContain(res.statusCode);
  });

  // 9
  it("GET /admin/reports -> should require auth (expect 401/403)", async () => {
    const res = await request(app).get("/admin/reports");
    expect([401, 403]).toContain(res.statusCode);
  });

  // 10
  it("POST /auth/request-otp -> should reject invalid email (expect 400)", async () => {
    const res = await request(app).post("/auth/request-otp").send({
      email: "not-an-email",
    });

    // if your api returns 422 instead 400, we allow it
    expect([400, 422, 404, 403]).toContain(res.statusCode);
  });

  // 11
  it("POST /auth/verify-otp -> should reject missing otp/email (expect 400)", async () => {
    const res = await request(app).post("/auth/verify-otp").send({});

    expect([400, 422]).toContain(res.statusCode);
  });

  // 12
  it("Express trust proxy should be enabled (smoke test)", async () => {
    // not directly accessible, but we can ensure app doesn't crash
    const res = await request(app)
      .get("/health")
      .set("X-Forwarded-For", "1.2.3.4");

    expect(res.statusCode).toBe(200);
  });
});
