export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface RideRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  date: string;
  time: string;
  flightDetails?: string;
  participants: Participant[];
  maxParticipants: number;
  createdAt: string;
  status: 'active' | 'expired' | 'full';
}

export interface Participant {
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: string;
  joinLeaveCount: number;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface JoinLeaveRecord {
  oderId: string;
  count: number;
}
