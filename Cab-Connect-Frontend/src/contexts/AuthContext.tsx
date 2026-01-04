import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { socket, connectSocket } from '@/lib/socket';
import { format } from 'date-fns';

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
interface AdminNotification {
  _id: string;
  title: string;
  message: string;
  ride?: {
    destination: 'airport' | 'campus';
    departureTime: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode}){
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNotification, setActiveNotification] = useState<AdminNotification | null>(null);

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

  const fetchNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    if(!token) return;

    try{
      const res = await fetch('http://localhost:5000/notifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if(!res.ok) return;
      const data = await res.json();
      if (data.notifications?.length > 0) {
        setActiveNotification({
          _id: data.notifications[0]._id,
          title: 'Ride Removed',
          message: data.notifications[0].message,
        });
      }
    }catch(err){
      console.log('Fetch notifications error', err);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    socket.on('admin-notification', (payload: AdminNotification) => {
      setActiveNotification(payload);
    });

    return () => {
      socket.off('admin-notification');
    };
  }, []);

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
       {/* ADMIN NOTIFICATION POPUP */}
       {activeNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-semibold mb-2 text-destructive">
              {activeNotification.title}
            </h2>

            <p className="text-sm text-muted-foreground mb-3">
              {activeNotification.message}
            </p>

            {activeNotification?.ride?.destination && (
              <div className="bg-muted/40 rounded-lg p-3 text-sm mb-4">
                <p>
                  <span className="font-medium">Destination:</span>{' '}
                  {activeNotification.ride.destination}
                </p>

                {activeNotification.ride.departureTime && (
                  <p>
                    <span className="font-medium">Departure:</span>{' '}
                    {format(
                      new Date(activeNotification.ride.departureTime),
                      'MMM d, yyyy • hh:mm a'
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={async () => {
                  const token = localStorage.getItem('accessToken');
                  if (activeNotification?._id && token) {
                    await fetch(
                      `http://localhost:5000/notifications/${activeNotification._id}/read`,
                      {
                        method: 'PATCH',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }
                    );
                  }
                  setActiveNotification(null);
                }}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
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