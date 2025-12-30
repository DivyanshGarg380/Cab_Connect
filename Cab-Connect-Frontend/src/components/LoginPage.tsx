import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plane, Users, MessageCircle, Mail, Key } from 'lucide-react';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';


export function LoginPage () {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const navigate = useNavigate();
  const [canResendOtp, setCanResendOtp] = useState(false);

  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const resetOtpFlow = () => {
    setIsOtpSent(false);
    setOtp('');
  };


  const handleSendOtp = async () => {
    if(!email) return;
    try{
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if(!res.ok){
        toast.error(data.message || 'Failed to send OTP');
        return;
      }

      toast.success('OTP sent successfully');
      setIsOtpSent(true);
      setCanResendOtp(false);
      setOtp('');
    } catch(error){
      toast.error('Server error while sending OTP');
    } finally{
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try{
      const res = await fetch('http://localhost:5000/auth/verify-otp',{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Invalid OTP');
        if (
          data.code === 'OTP_ATTEMPTS_EXCEEDED' ||
          data.code === 'OTP_EXPIRED'
        ) {
          setIsOtpSent(false);
          setCanResendOtp(true);
          setOtp('');
        }
        return;
      }
      const token = data.accessToken;

      localStorage.setItem('accessToken', token);
      if(showAdminPassword){
        const adminRes = await fetch(
          'http://localhost:5000/auth/admin-login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ adminPassword }),
          }
        );

        const adminData = await adminRes.json();

        if (!adminRes.ok) {
          toast.error(adminData.message || 'Admin login failed');
          return;
        }
      }

      await login(token);
      toast.success('Login successful');
      

    } catch(error){
      toast.error('Login failed');
    } finally{
      setIsLoading(false);
    }
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

              {/* OTP Section */}
               {isOtpSent && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">OTP</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="pl-12 h-12"
                      />
                    </div>
                  </div>
                )}

                {/* Resend OTP */}
                {canResendOtp ? (
                  <Button
                    type="button"
                    variant="gradient"
                    className="w-full"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    Resend OTP
                  </Button>
                ) : !isOtpSent ? (
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full"
                    variant="gradient"
                    disabled={isLoading}
                  >
                    Send OTP
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="gradient"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Verify & Sign In
                  </Button>
                )}
            </form>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {showAdminPassword ? '← Back to regular login' : 'Admin Login →'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
