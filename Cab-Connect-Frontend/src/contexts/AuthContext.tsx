import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { socket, connectSocket } from '@/lib/socket';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode}){
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /* Loading User from token on app start */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if(!token){
      setIsLoading(false);
      return;
    }

    fetch(`http://localhost:5000/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then( async (res) => {
      if (!res.ok) throw new Error('Session expired');
      return res.json();
    }).then((data) => {
        setUser(data.user);
    }).catch(() => {
      localStorage.removeItem('accessToken');
      setUser(null);
    }).finally(() => {
      setIsLoading(false);
    })
  }, []);

  /* Login using JWT Toeken */

  const login = async (token: string) => {
    localStorage.setItem('accessToken', token);

    const res = await fetch(`http://localhost:5000/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      toast.error('Failed to load user');
      throw new Error('Auth failed');
    }

    const data = await res.json();
    setUser(data.user);
    toast.success('Logged in successfully');
  };

  /* Logout */
  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    toast.info('Logged out');
  };


  useEffect(() => {
    if (user) {
      connectSocket();
    } else {
      socket.disconnect();
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        logout,
      }}
    > 
      
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if(!ctx){
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}