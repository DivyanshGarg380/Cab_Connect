import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Cab Connect - Production Security Logic", () => {

  // 1. AUTH SECURITY
  describe("Authentication Gatekeeping", () => {
    it("POST /auth/request-otp -> should reject non-college email domains", async () => {
      const res = await request(app)
        .post("/auth/request-otp")
        .send({ email: "student@gmail.com" });

      // Input validation error
      expect(res.statusCode).toBe(400);
    });

    it("GET /auth/me -> should return 401 without JWT cookie", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });

  // 2. RIDE BUSINESS RULES
  describe("Ride Management Logic", () => {
    it("POST /rides -> should block ride creation if no auth token is present", async () => {
      const res = await request(app)
        .post("/rides")
        .send({
          destination: "Airport",
          travelTime: new Date(Date.now() + 3600000).toISOString()
        });

      expect(res.statusCode).toBe(401);
    });

    it("PATCH /rides/:id/lock -> should block unauthorized lock attempts", async () => {
      const res = await request(app).patch("/rides/some-ride-id/lock");
      expect(res.statusCode).toBe(401);
    });
  });

  // 3. MODERATION & BANS (Auth must succeed before role/ban logic runs)
  describe("Banned User Enforcement", () => {
    it("POST /rides -> should not allow ride creation without valid authentication", async () => {
      const res = await request(app)
        .post("/rides")
        .set("Cookie", ["token=fake_or_invalid_token"])
        .send({ destination: "Railway Station" });

      // Auth fails before banned logic can run
      expect(res.statusCode).toBe(401);
    });
  });

  // 4. REPORTING LOGIC
  describe("User Reporting System", () => {
    it("POST /reports -> should require authentication before report validation", async () => {
      const res = await request(app)
        .post("/reports")
        .set("Cookie", ["token=invalid_token"])
        .send({
          targetUserId: "some_user",
          rideId: "some_ride_id",
          reason: "SPAM"
        });

      // Auth fails before business logic runs
      expect(res.statusCode).toBe(401);
    });
  });

  // 5. ADMIN ESCALATION
  describe("Admin Path Security", () => {
    it("GET /admin/reports -> should require authentication", async () => {
      const res = await request(app)
        .get("/admin/reports")
        .set("Cookie", ["token=invalid_token"]);

      // Must be logged in before role is checked
      expect(res.statusCode).toBe(401);
    });
  });
});
