import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ride, Message} from '@/types/index';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';

interface RideContextType {
  rides: Ride[];
  fetchRides: () => Promise<void>;
  messages: Record<string, Message[]>;
  fetchMessages: (rideId: string) => Promise<void>;
  sendMessage: (rideId: string, content: string) => Promise<void>;
  createRide: (
    date: string,
    time: string,
    flightDetails?: string,
    destination?: string
  ) => Promise<void>;
  joinRide: (rideId: string) => Promise<void>;
  leaveRide: (rideId: string) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
  clearUnread: (rideId: string) => void;
  unread: Record<string, boolean>;
  deleteRideAdmin: (rideId: string) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [ rides, setRides ] = useState<Ride[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unread, setUnread] = useState<Record<string, boolean>>({});

  const fetchRides = async () => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    try {
      const res = await fetch(`http://localhost:5000/rides`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error('Failed to fetch rides');
        return;
      }

      const data = await res.json();
      setRides(data.rides); 
    } catch (err) {
      console.error('Fetch rides error:', err);
    }
  };

  const createRide = async (
    date: string,
    time: string,
    destination: 'airport' | 'campus'
  ) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const departureTime = new Date(`${date}T${time}`).toISOString();

    try {
      const res = await fetch(`http://localhost:5000/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          destination,
          departureTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create ride');
      }

      await fetchRides();

    } catch (err: any) {
      console.error('Create ride error:', err);
      throw err;
    }
  };

  useEffect(() => {
    if(isAuthenticated){
      fetchRides();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleRideEnded = () => {
      fetchRides();
    };

    socket.on('ride-ended', handleRideEnded);
    return () => {
      socket.off('ride-ended', handleRideEnded);
    };
  }, []); 

  useEffect(() => {
    socket.on("ride:updated", ({ rideId, type, ride }) => {
      setRides(prev => {
        if (type === "delete") {
          return prev.filter(r => r._id !== rideId);
        }

        const exists = prev.find(r => r._id === rideId);
        if (exists) {
          return prev.map(r => r._id === rideId ? ride : r);
        }

        return [...prev, ride];
      });
    });

    return () => {
      socket.off("ride:updated");
    };
  }, []);

  const joinRide = async (rideId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await fetch(`http://localhost:5000/rides/${rideId}/join`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    await fetchRides();
  };

  const leaveRide = async (rideId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const res = await fetch(`http://localhost:5000/rides/${rideId}/leave`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message);
    }

    await fetchRides();
  };

  const deleteRide = async (rideId: string) => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    try{
      const res = await fetch(`http://localhost:5000/rides/${rideId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if(!res.ok){
        throw new Error(data.message || 'Failed to delete ride');
      }
      setRides(prev => prev.filter(r => r._id !== rideId));
    }catch (err){
      throw err;
    }
  };

  const fetchMessages = async(rideId: string) => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    const res = await fetch(`http://localhost:5000/rides/${rideId}/messages`, {
      headers: { Authorization: `Bearer ${token}`},
    });

    if(!res.ok) return;
    const data = await res.json();

    setMessages(prev => ({
      ...prev,
      [rideId]: data.messages,
    }));
  };

  const sendMessage = async (rideId: string, content: string) => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;
    const res = await fetch(`http://localhost:5000/rides/${rideId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: content }),
    });

    if(!res.ok) return;
    const data = await res.json();
    setMessages(prev => ({
      ...prev,
      [rideId]: [...(prev[rideId] || []),  data.message],
    }));
  };

  useEffect(() => {
    socket.on('new-message', (message: Message) => {
      setMessages(prev => ({
        ...prev,
        [message.ride]: [...(prev[message.ride] || []), message],
      }));

      setUnread(prev => ({
        ...prev,
        [message.ride]: true,
      }))
    });

    return () => {
      socket.off('new-message');
    };
  }, []);

  useEffect(() => {
    const hasUnread = Object.values(unread).some(Boolean);
    const favicon = document.getElementById('favicon') as HTMLLinkElement | null;

    if (!favicon) return;

    favicon.href = hasUnread
      ? '/favicon-unread.svg'
      : '/favicon.svg';
  }, [unread]);

  const clearUnread = (rideId: string) => {
    setUnread(prev => ({ ...prev, [rideId]: false }));
  };

  const deleteRideAdmin = async (rideId: string) => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    const res = await fetch(`http://localhost:5000/admin/rides/${rideId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if(!res.ok){
      const err = await res.json();
      throw new Error(err.message || 'Admin delete failed');
    }
    setRides(prev => prev.filter(r => r._id !== rideId));
  };

  return (
    <RideContext.Provider value={{ rides, fetchRides, createRide, joinRide, leaveRide, deleteRide, fetchMessages, sendMessage, messages, clearUnread, unread, deleteRideAdmin}}>
      {children}
    </RideContext.Provider>
  );
}

export function useRides() {
  const ctx = useContext(RideContext);
  if (!ctx) {
    throw new Error('useRides must be used within RideProvider');
  }
  return ctx;
}