import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ride } from '@/types/index';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';

interface RideContextType {
  rides: Ride[];
  fetchRides: () => Promise<void>;
  createRide: (
    date: string,
    time: string,
    flightDetails?: string,
    destination?: string
  ) => Promise<void>;
  joinRide: (rideId: string) => Promise<void>;
  leaveRide: (rideId: string) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [ rides, setRides ] = useState<Ride[]>([]);

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

  return (
    <RideContext.Provider value={{ rides, fetchRides, createRide, joinRide, leaveRide, deleteRide}}>
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