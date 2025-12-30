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
  creator: string;          
  participants: string[];  
  date: string;
  destination: 'airport' | 'campus';
  departureTime: string;
  status: 'open' | 'full' | 'expired';
}
export interface RidesResponse {
  rides: Ride[];
}
