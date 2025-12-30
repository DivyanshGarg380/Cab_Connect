import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, LogOut, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function Header() {
  const { user, logout, isAdmin, isLoading } = useAuth();
  const location = useLocation();
  if(isLoading) return null;

  const getDisplayName = (email: string) => {
  const localPart = email.split('mit')[0];

  return localPart
    .replace(/\d+/g, '')               
    .replace(/[._]/g, ' ')            
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">CabShare</span>
          </Link>

          {isAdmin && (
            <nav className="hidden sm:flex items-center gap-1 ml-4">
              <Link to="/">
                <Button 
                  variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
              <Link to="/admin">
                <Button 
                  variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} 
                  size="sm" 
                  className="gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
              <Shield className="w-3 h-3" />
              Admin
            </div>
          )}
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-secondary-foreground">{getDisplayName(user.email)}</span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
