import { describe, it, expect } from "vitest";
import {
  isCollegeEmail,
  isValidOtp,
  canRequestOtp,
  canCreateRide,
  canChat,
  canJoinRide,
  canJoinRideCapacity,
  isCreatorAutoJoined,
  isRideExpired,
  shouldPermanentBan,
  canReportUser,
} from "../tests/rules.js"

describe("Cab Connect backend rules", () => {
  // 1
  it("accepts valid college email (.edu or .ac.in)", () => {
    expect(isCollegeEmail("abc@college.edu")).toBe(true);
    expect(isCollegeEmail("abc@iiit.ac.in")).toBe(true);
  });

  // 2
  it("rejects invalid email for OTP login", () => {
    expect(isCollegeEmail("abc@gmail.com")).toBe(false);
    expect(isCollegeEmail("not-an-email")).toBe(false);
    expect(isCollegeEmail("")).toBe(false);
  });

  // 3
  it("accepts a valid 6-digit OTP", () => {
    expect(isValidOtp("123456")).toBe(true);
    expect(isValidOtp(654321)).toBe(true);
  });

  // 4
  it("rejects invalid OTP formats", () => {
    expect(isValidOtp("12345")).toBe(false);
    expect(isValidOtp("abcdef")).toBe(false);
    expect(isValidOtp(null)).toBe(false);
  });

  // 5
  it("blocks OTP request if max attempts reached", () => {
    expect(canRequestOtp({ attempts: 4, maxAttempts: 5 })).toBe(true);
    expect(canRequestOtp({ attempts: 5, maxAttempts: 5 })).toBe(false);
  });

  // 6
  it("temp banned users cannot create rides", () => {
    expect(canCreateRide({ isTempBanned: true, isPermBanned: false })).toBe(false);
  });

  // 7
  it("perm banned users cannot create rides", () => {
    expect(canCreateRide({ isTempBanned: false, isPermBanned: true })).toBe(false);
  });

  // 8
  it("temp banned users cannot chat", () => {
    expect(canChat({ isTempBanned: true, isPermBanned: false })).toBe(false);
  });

  // 9
  it("temp banned users CAN still join rides (your policy)", () => {
    expect(canJoinRide({ isPermBanned: false })).toBe(true);
  });

  // 10
  it("ride join should block if ride already has 4 participants", () => {
    expect(canJoinRideCapacity({ participantsCount: 3 })).toBe(true);
    expect(canJoinRideCapacity({ participantsCount: 4 })).toBe(false);
  });

  // 11
  it("creator is auto-joined if creatorId exists in participants", () => {
    expect(
      isCreatorAutoJoined({
        creatorId: "u1",
        participants: ["u1", "u2"],
      })
    ).toBe(true);

    expect(
      isCreatorAutoJoined({
        creatorId: "u1",
        participants: ["u2"],
      })
    ).toBe(false);
  });

  // 12
  it("ride expires if travelTime is in past", () => {
    const now = Date.now();
    expect(isRideExpired(now - 1000, now)).toBe(true);
    expect(isRideExpired(now + 60_000, now)).toBe(false);
  });

  // Bonus: strikes rule
  it("permanent ban triggers after 3 strikes", () => {
    expect(shouldPermanentBan(0)).toBe(false);
    expect(shouldPermanentBan(2)).toBe(false);
    expect(shouldPermanentBan(3)).toBe(true);
    expect(shouldPermanentBan(5)).toBe(true);
  });

  // Bonus: report rules
  it("reporting works only if both users are participants and not already reported", () => {
    const rideParticipants = ["u1", "u2", "u3"];

    expect(
      canReportUser({
        reporterId: "u1",
        targetId: "u2",
        rideParticipants,
        alreadyReported: false,
      })
    ).toBe(true);

    expect(
      canReportUser({
        reporterId: "u1",
        targetId: "u1",
        rideParticipants,
        alreadyReported: false,
      })
    ).toBe(false);

    expect(
      canReportUser({
        reporterId: "u9",
        targetId: "u2",
        rideParticipants,
        alreadyReported: false,
      })
    ).toBe(false);

    expect(
      canReportUser({
        reporterId: "u1",
        targetId: "u2",
        rideParticipants,
        alreadyReported: true,
      })
    ).toBe(false);
  });
});
