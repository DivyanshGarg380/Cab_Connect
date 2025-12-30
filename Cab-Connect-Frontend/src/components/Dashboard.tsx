import React, { useState, useMemo } from 'react';
import { useRides } from '@/contexts/RideContext';
import { Header } from './Header';
import { CreateRideModal } from './CreateRideModal';
import { RideCard } from './RideCard';
import { ChatPanel } from './ChatPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Calendar, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { rides } = useRides();
  const [activeChatRide, setActiveChatRide] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const { user }  = useAuth();

  const sortedRides = useMemo(() => {
    return [...rides].sort((a, b) => {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (b.status === 'open' && a.status !== 'open') return 1;

      return (
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
  }, [rides]);

  const activeRides = useMemo(
    () => sortedRides.filter((r) => r.status === 'open'),
    [sortedRides]
  );

  const expiredRides = useMemo(
    () => sortedRides.filter((r) => r.status === 'expired'),
    [sortedRides]
  );

  const myRides = useMemo(() => {
    if (!user) return [];
    return rides.filter(
      (r) =>
        r.creator === user.id ||
        r.participants.some((p) => p === user.id)
    );
  }, [rides, user]);

  const displayRides = activeTab === 'all' ? activeRides : activeTab === 'my' ? myRides : sortedRides;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className={`flex-1 ${activeChatRide ? 'lg:mr-96' : ''}`}>
            {/* Hero Section */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    Airport Cab Sharing
                  </h1>
                  <p className="text-muted-foreground">
                    Find travel buddies and split your cab fare
                  </p>
                </div>
                <CreateRideModal />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card-elevated p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{activeRides.length}</p>
                    <p className="text-xs text-muted-foreground">Active Rides</p>
                  </div>
                </div>
                <div className="card-elevated p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{myRides.length}</p>
                    <p className="text-xs text-muted-foreground">Your Rides</p>
                  </div>
                </div>
                <div className="card-elevated p-4 flex items-center gap-3 col-span-2 md:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <Plane className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Destination</p>
                    <p className="text-xs text-muted-foreground">All rides go to the Airport</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="all">All Active</TabsTrigger>
                <TabsTrigger value="my">My Rides</TabsTrigger>
                <TabsTrigger value="expired">History</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {activeRides.length === 0 ? (
                  <EmptyState message="No active rides available. Be the first to create one!" />
                ) : (
                  activeRides.map(ride => (
                    <RideCard 
                      key={ride._id} 
                      ride={ride} 
                      onOpenChat={setActiveChatRide}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="my" className="space-y-4">
                {myRides.length === 0 ? (
                  <EmptyState message="You haven't joined any rides yet. Browse active rides and join one!" />
                ) : (
                  myRides.map(ride => (
                    <RideCard 
                      key={ride._id} 
                      ride={ride} 
                      onOpenChat={setActiveChatRide}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="expired" className="space-y-4">
                {expiredRides.length === 0 ? (
                  <EmptyState message="No expired rides yet." />
                ) : (
                  expiredRides.map((ride) => (
                    <RideCard
                      key={ride._id}
                      ride={ride}
                      onOpenChat={setActiveChatRide}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Chat Panel */}
          {activeChatRide && (
            <ChatPanel 
              rideId={activeChatRide} 
              onClose={() => setActiveChatRide(null)} 
            />
          )}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="card-elevated p-12 text-center">
      <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
