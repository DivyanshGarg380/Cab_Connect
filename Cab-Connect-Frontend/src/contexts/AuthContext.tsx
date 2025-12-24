import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COLLEGE_DOMAIN = '@college.edu'; // Change this to your actual college domain
const ADMIN_EMAIL = 'himynameisdivyansh@gmail.com'; // Admin email (case-insensitive)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('cabshare_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string): Promise<boolean> => {
    // Validate college email
    if (!email.endsWith(COLLEGE_DOMAIN) && !email.endsWith('@gmail.com')) {
      toast.error(`Please use your college email (${COLLEGE_DOMAIN})`);
      return false;
    }

    // Simulate login - in production, this would be actual auth
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    };

    setUser(newUser);
    localStorage.setItem('cabshare_user', JSON.stringify(newUser));
    toast.success('Welcome to CabShare!');
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cabshare_user');
    toast.info('You have been logged out');
  };

  const isAdmin = user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
