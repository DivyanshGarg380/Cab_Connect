import request from "supertest";
import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import app from "../app.js"
import User from "../models/User.model.js";
import Ride from "../models/Ride.model.js";
import "./setupTestDB.js";


const createToken = (user) =>
  jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET);

  describe("Advanced Ride Logic", () => {

    it("prevents overbooking in race condition", async () => {
      const creator = await User.create({ email: "creator@learner.manipal.edu", role: "user" });
      const u2 = await User.create({ email: `u2_${Date.now()}@learner.manipal.edu`, role: "user" });
      const u3 = await User.create({ email: `u3_${Date.now()}@learner.manipal.edu`, role: "user" });

      const now = new Date();
      const departure = new Date(now.getTime() + 60 * 60 * 1000);

      const ride = await Ride.create({
        creator: creator._id,
        destination: "campus",
        date: new Date().toISOString().split("T")[0],
        departureTime: new Date(Date.now() + 3600000),
        participants: [creator._id, u2._id, u3._id],
        status: "open",
        isLocked: false,
      });

      const u4 = await User.create({ email: `u4_${Date.now()}@learner.manipal.edu`, role: "user" });
      const u5 = await User.create({ email: `u5_${Date.now()}@learner.manipal.edu`, role: "user" });

      const t4 = createToken(u4);
      const t5 = createToken(u5);

      const join = (t) =>
        request(app)
          .post(`/rides/${ride._id}/join`)
          .set("Cookie", [`token=${t}`]);

      const [r1, r2] = await Promise.all([join(t4), join(t5)]);

      const updatedRide = await Ride.findById(ride._id);

      expect(updatedRide.participants.length).toBe(4);
      expect([r1.statusCode, r2.statusCode].sort()).toEqual([200, 400]);
      });
  });
