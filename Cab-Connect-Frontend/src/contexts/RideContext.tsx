import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ride } from '@/types/index';

const API_BASE = 'http://localhost:5000';

interface RideContextType {
  rides: Ride[];
  fetchRides: () => Promise<void>;
  createRide: (
    date: string,
    time: string,
    flightDetails?: string,
    destination?: string
  ) => Promise<void>;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

export function RideProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [ rides, setRides ] = useState<Ride[]>([]);

  const fetchRides = async () => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    try {
      const res = await fetch(`${API_BASE}/rides`, {
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
      const res = await fetch(`${API_BASE}/rides`, {
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

      setRides(prev => [...prev, data.ride]);

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

  return (
    <RideContext.Provider value={{ rides, fetchRides, createRide }}>
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