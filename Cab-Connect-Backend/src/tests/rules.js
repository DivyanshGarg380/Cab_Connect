export function isCollegeEmail(email) {
  if (!email || typeof email !== "string") return false;
  // change domain if needed
  return /^[^\s@]+@[^\s@]+\.(edu|ac\.in)$/i.test(email);
}

export function isValidOtp(otp) {
  if (typeof otp !== "string" && typeof otp !== "number") return false;
  const s = String(otp);
  return /^[0-9]{6}$/.test(s);
}

export function canRequestOtp({ attempts, maxAttempts = 5 }) {
  if (attempts == null) return true;
  return attempts < maxAttempts;
}

export function canCreateRide({ isTempBanned, isPermBanned }) {
  if (isPermBanned) return false;
  if (isTempBanned) return false;
  return true;
}

export function canChat({ isTempBanned, isPermBanned }) {
  if (isPermBanned) return false;
  if (isTempBanned) return false;
  return true;
}

export function canJoinRide({ isPermBanned }) {
  // your policy allows temp-banned users to join rides
  if (isPermBanned) return false;
  return true;
}

export function canJoinRideCapacity({ participantsCount, max = 4 }) {
  return participantsCount < max;
}

export function isCreatorAutoJoined({ creatorId, participants }) {
  return participants?.includes(creatorId) ?? false;
}

export function isRideExpired(travelTime, now = Date.now()) {
  const t = new Date(travelTime).getTime();
  return Number.isFinite(t) && t <= now;
}

export function shouldPermanentBan(strikes) {
  return strikes >= 3;
}

export function canReportUser({
  reporterId,
  targetId,
  rideParticipants = [],
  alreadyReported = false,
}) {
  if (!reporterId || !targetId) return false;
  if (reporterId === targetId) return false;

  const isReporterInRide = rideParticipants.includes(reporterId);
  const isTargetInRide = rideParticipants.includes(targetId);

  if (!isReporterInRide || !isTargetInRide) return false;
  if (alreadyReported) return false;

  return true;
}
