import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, Users, MessageCircle, Mail } from 'lucide-react';
import { Input } from '../components/ui/input';

export function LoginPage () {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Branding */}
        <div className="lg:w-1/2 bg-gradient-to-br from-primary to-[hsl(195,70%,45%)] p-8 lg:p-16 flex flex-col justify-center text-primary-foreground">
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Plane className="w-7 h-7" />
              </div>
              <h1 className="text-3xl font-bold">CabShare</h1>
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Share your ride to the airport with fellow students
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Save money, make friends, and travel together. Connect with classmates heading to the airport on the same day.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Find Travel Buddies</h3>
                  <p className="text-sm opacity-80">Connect with students sharing your schedule</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Coordinate Easily</h3>
                  <p className="text-sm opacity-80">Chat with your group to plan the trip</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-muted-foreground">Sign in with your college email to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  College Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@learner.manipal.edu"
                    className="input-styled pl-12 w-full"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use your official college email address (or @gmail.com for demo)
                </p>
              </div>

              {showAdminPassword && (
                <>
                  <div>
                    <label htmlFor="adminPassword" className="block text-sm font-medium text-foreground mb-2">
                      Admin Password
                    </label>
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="input-styled h-12 w-full"
                    />
                  </div>
                </>
              )}

            <Button
              type="submit"
              variant="gradient"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {showAdminPassword ? '← Back to regular login' : 'Admin Login →'}
            </button>

            <div className="bg-accent/50 border border-transparent rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Mode:</p>
              <p className="text-xs text-gray-600">
                Enter any email ending with @gmail.com or @college.edu to test the app
              </p>
              {showAdminPassword && (
                <p className="text-xs text-gray-600 mt-2">
                  Admin password: <span className="font-mono font-semibold">admin123</span>
                </p>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
