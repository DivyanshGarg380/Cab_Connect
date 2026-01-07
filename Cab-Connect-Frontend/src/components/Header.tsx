import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, LogOut, User, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

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

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-slate-800 rounded-lg flex items-center justify-center">
            <Plane className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">CabShare</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Dashboard
          </Link>
          
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${
                location.pathname === '/admin'
                  ? 'text-red-600'
                  : 'text-red-500 hover:text-red-600'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-4">
          {/* Report Button */}
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-1 text-red-500 hover:text-red-600"
            onClick={() => {
              // TODO: open report modal later
              console.log("Report button clicked");
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Report</span>
          </Button>

          {/* User Info */}
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700 font-medium">
              {getDisplayName(user?.email)}
            </span>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>

        </div>

      </div>
    </nav>
  );
}
