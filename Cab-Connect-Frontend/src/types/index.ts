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
  creator: RideParticipant;          
  participants: RideParticipant[];  
  date: string;
  destination: 'airport' | 'campus';
  departureTime: string;
  status: 'open' | 'full' | 'expired';
}
export interface RidesResponse {
  rides: Ride[];
}
export interface Message {
  _id: string;
  ride: string;
  sender: {
    _id: string;
    email: string;
  } | null;
  text: string;
  type?: 'user' | 'system';
  createdAt: string;
}
