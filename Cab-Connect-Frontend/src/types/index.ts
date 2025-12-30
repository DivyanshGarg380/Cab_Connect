export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface RideParticipant {
  _id: string;
  email: string;
}

export interface Ride {
  _id: string;
  creator: {
    _id: string;
    email: string;
  };
  participants: RideParticipant[];
  date: string;          
  time?: string;    
  status: 'active' | 'expired';
  maxParticipants: number;
}
export interface RidesResponse {
  rides: Ride[];
}
