import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RideRequest, Message, Participant } from '@/types';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface RideContextType {
  rides: RideRequest[];
  messages: Record<string, Message[]>;
  createRide: (date: string, time: string, flightDetails?: string) => void;
  joinRide: (rideId: string) => boolean;
  leaveRide: (rideId: string) => boolean;
  sendMessage: (rideId: string, content: string) => void;
  getJoinLeaveCount: (rideId: string) => number;
  canJoinOrLeave: (rideId: string) => boolean;
  isParticipant: (rideId: string) => boolean;
  getUserRides: () => RideRequest[];
  deleteRide: (rideId: string) => void;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

const MAX_JOIN_LEAVE = 3;
const MAX_PARTICIPANTS = 4;

// Sample data for demo
const sampleRides: RideRequest[] = [
  {
    id: '1',
    creatorId: 'sample-1',
    creatorName: 'John Doe',
    creatorEmail: 'john.doe@college.edu',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    flightDetails: 'AI-302 to Delhi',
    participants: [
      { userId: 'sample-1', userName: 'John Doe', userEmail: 'john.doe@college.edu', joinedAt: new Date().toISOString(), joinLeaveCount: 0 }
    ],
    maxParticipants: MAX_PARTICIPANTS,
    createdAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: '2',
    creatorId: 'sample-2',
    creatorName: 'Jane Smith',
    creatorEmail: 'jane.smith@college.edu',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:30',
    participants: [
      { userId: 'sample-2', userName: 'Jane Smith', userEmail: 'jane.smith@college.edu', joinedAt: new Date().toISOString(), joinLeaveCount: 0 },
      { userId: 'sample-3', userName: 'Mike Johnson', userEmail: 'mike.johnson@college.edu', joinedAt: new Date().toISOString(), joinLeaveCount: 1 }
    ],
    maxParticipants: MAX_PARTICIPANTS,
    createdAt: new Date().toISOString(),
    status: 'active'
  }
];

export function RideProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rides, setRides] = useState<RideRequest[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [joinLeaveRecords, setJoinLeaveRecords] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load rides from localStorage or use sample data
    const savedRides = localStorage.getItem('cabshare_rides');
    const savedMessages = localStorage.getItem('cabshare_messages');
    const savedRecords = localStorage.getItem('cabshare_joinleave');

    if (savedRides) {
      setRides(JSON.parse(savedRides));
    } else {
      setRides(sampleRides);
    }

    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    if (savedRecords) {
      setJoinLeaveRecords(JSON.parse(savedRecords));
    }
  }, []);

  // Update ride statuses based on date
  useEffect(() => {
    const now = new Date();
    const updatedRides = rides.map(ride => {
      const rideDate = new Date(`${ride.date}T${ride.time}`);
      if (rideDate < now && ride.status === 'active') {
        return { ...ride, status: 'expired' as const };
      }
      if (ride.participants.length >= ride.maxParticipants && ride.status === 'active') {
        return { ...ride, status: 'full' as const };
      }
      return ride;
    });

    if (JSON.stringify(updatedRides) !== JSON.stringify(rides)) {
      setRides(updatedRides);
      localStorage.setItem('cabshare_rides', JSON.stringify(updatedRides));
    }
  }, [rides]);

  const createRide = (date: string, time: string, flightDetails?: string) => {
    if (!user) return;

    const newRide: RideRequest = {
      id: crypto.randomUUID(),
      creatorId: user.id,
      creatorName: user.name,
      creatorEmail: user.email,
      date,
      time,
      flightDetails,
      participants: [
        {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          joinedAt: new Date().toISOString(),
          joinLeaveCount: 0
        }
      ],
      maxParticipants: MAX_PARTICIPANTS,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    const updatedRides = [newRide, ...rides];
    setRides(updatedRides);
    localStorage.setItem('cabshare_rides', JSON.stringify(updatedRides));
    toast.success('Ride request created successfully!');
  };

  const getRecordKey = (rideId: string) => `${user?.id}-${rideId}`;

  const getJoinLeaveCount = (rideId: string): number => {
    if (!user) return 0;
    return joinLeaveRecords[getRecordKey(rideId)] || 0;
  };

  const canJoinOrLeave = (rideId: string): boolean => {
    return getJoinLeaveCount(rideId) < MAX_JOIN_LEAVE;
  };

  const isParticipant = (rideId: string): boolean => {
    if (!user) return false;
    const ride = rides.find(r => r.id === rideId);
    return ride?.participants.some(p => p.userId === user.id) || false;
  };

  const joinRide = (rideId: string): boolean => {
    if (!user) return false;

    const ride = rides.find(r => r.id === rideId);
    if (!ride) return false;

    if (ride.status !== 'active') {
      toast.error('This ride is no longer available');
      return false;
    }

    if (isParticipant(rideId)) {
      toast.error('You are already in this ride');
      return false;
    }

    if (!canJoinOrLeave(rideId)) {
      toast.error(`You have reached the maximum join/leave limit (${MAX_JOIN_LEAVE}) for this ride`);
      return false;
    }

    if (ride.participants.length >= ride.maxParticipants) {
      toast.error('This ride is already full');
      return false;
    }

    const recordKey = getRecordKey(rideId);
    const newCount = (joinLeaveRecords[recordKey] || 0) + 1;

    const updatedRide = {
      ...ride,
      participants: [
        ...ride.participants,
        {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          joinedAt: new Date().toISOString(),
          joinLeaveCount: newCount
        }
      ]
    };

    const updatedRides = rides.map(r => r.id === rideId ? updatedRide : r);
    const updatedRecords = { ...joinLeaveRecords, [recordKey]: newCount };

    setRides(updatedRides);
    setJoinLeaveRecords(updatedRecords);
    localStorage.setItem('cabshare_rides', JSON.stringify(updatedRides));
    localStorage.setItem('cabshare_joinleave', JSON.stringify(updatedRecords));

    toast.success(`Joined ride! (${MAX_JOIN_LEAVE - newCount} join/leave actions remaining)`);
    return true;
  };

  const leaveRide = (rideId: string): boolean => {
    if (!user) return false;

    const ride = rides.find(r => r.id === rideId);
    if (!ride) return false;

    if (!isParticipant(rideId)) {
      toast.error('You are not in this ride');
      return false;
    }

    if (ride.creatorId === user.id) {
      toast.error('Creator cannot leave their own ride');
      return false;
    }

    if (!canJoinOrLeave(rideId)) {
      toast.error(`You have reached the maximum join/leave limit (${MAX_JOIN_LEAVE}) for this ride`);
      return false;
    }

    const recordKey = getRecordKey(rideId);
    const newCount = (joinLeaveRecords[recordKey] || 0) + 1;

    const updatedRide = {
      ...ride,
      participants: ride.participants.filter(p => p.userId !== user.id),
      status: ride.status === 'full' ? 'active' as const : ride.status
    };

    const updatedRides = rides.map(r => r.id === rideId ? updatedRide : r);
    const updatedRecords = { ...joinLeaveRecords, [recordKey]: newCount };

    setRides(updatedRides);
    setJoinLeaveRecords(updatedRecords);
    localStorage.setItem('cabshare_rides', JSON.stringify(updatedRides));
    localStorage.setItem('cabshare_joinleave', JSON.stringify(updatedRecords));

    toast.info(`Left ride. (${MAX_JOIN_LEAVE - newCount} join/leave actions remaining)`);
    return true;
  };

  const sendMessage = (rideId: string, content: string) => {
    if (!user || !content.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      rideId,
      senderId: user.id,
      senderName: user.name,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    const rideMessages = messages[rideId] || [];
    const updatedMessages = {
      ...messages,
      [rideId]: [...rideMessages, newMessage]
    };

    setMessages(updatedMessages);
    localStorage.setItem('cabshare_messages', JSON.stringify(updatedMessages));
  };

  const getUserRides = (): RideRequest[] => {
    if (!user) return [];
    return rides.filter(ride => ride.participants.some(p => p.userId === user.id));
  };

  const deleteRide = (rideId: string) => {
    const updatedRides = rides.filter(r => r.id !== rideId);
    setRides(updatedRides);
    localStorage.setItem('cabshare_rides', JSON.stringify(updatedRides));
    
    // Also remove messages for this ride
    const updatedMessages = { ...messages };
    delete updatedMessages[rideId];
    setMessages(updatedMessages);
    localStorage.setItem('cabshare_messages', JSON.stringify(updatedMessages));
    
    toast.success('Ride deleted successfully');
  };

  return (
    <RideContext.Provider value={{
      rides,
      messages,
      createRide,
      joinRide,
      leaveRide,
      sendMessage,
      getJoinLeaveCount,
      canJoinOrLeave,
      isParticipant,
      getUserRides,
      deleteRide
    }}>
      {children}
    </RideContext.Provider>
  );
}

export function useRides() {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRides must be used within a RideProvider');
  }
  return context;
}
