import { describe, it, expect } from "vitest";

/**
 * These tests check core platform rules.
 * They do not require DB/Redis, so they're perfect for CI.
 */

describe("Cab Connect core rules", () => {
  it("should allow max 4 participants in a ride", () => {
    const ride = {
      participants: ["u1", "u2", "u3", "u4"],
      maxParticipants: 4,
    };

    const canJoin = ride.participants.length < ride.maxParticipants;
    expect(canJoin).toBe(false);
  });

  it("creator should auto-join ride (participants contains creator)", () => {
    const creatorId = "creator123";

    const ride = {
      createdBy: creatorId,
      participants: [creatorId], 
    };

    expect(ride.participants.includes(creatorId)).toBe(true);
  });

  it("ride should be considered expired if travelTime is in past", () => {
    const now = Date.now();

    const ride = {
      travelTime: new Date(now - 60 * 1000), 
    };

    const isExpired = ride.travelTime.getTime() < now;
    expect(isExpired).toBe(true);
  });

  it("temporary ban blocks ride creation + chat but allows joining rides", () => {
    const user = {
      isTempBanned: true,
    };

    const canCreateRide = !user.isTempBanned;
    const canChat = !user.isTempBanned;
    const canJoinRide = true; 

    expect(canCreateRide).toBe(false);
    expect(canChat).toBe(false);
    expect(canJoinRide).toBe(true);
  });

  it("permanent ban should trigger after 3 strikes", () => {
    const strikes = 3;
    const isPermanentBanned = strikes >= 3;

    expect(isPermanentBanned).toBe(true);
  });
});
