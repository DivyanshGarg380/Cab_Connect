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
    return [...rides]
      .filter(r => r.date && r.status)
      .sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (b.status === 'open' && a.status !== 'open') return 1;

        return new Date(a.date).getTime() - new Date(b.date).getTime();
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

    return rides.filter((r) => {
      if (!r.creator || !Array.isArray(r.participants)) return false;

      return (
        r.creator._id === user.id ||
        r.participants.some((p) => p._id === user.id)
      );
    });
  }, [rides, user]);

  const displayRides = activeTab === 'all' ? activeRides : activeTab === 'my' ? myRides : sortedRides;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-12">
          
          {/* HERO */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Airport Cab Sharing
              </h1>
              <p className="text-gray-600">
                Find travel buddies and split your cab fare
              </p>
            </div>

            <CreateRideModal />
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {activeRides.length}
                </p>
                <p className="text-sm text-gray-600">Active Rides</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {myRides.length}
                </p>
                <p className="text-sm text-gray-600">Your Rides</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-6">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Plane className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Destination
                </p>
                <p className="text-sm text-gray-600">
                  All rides go to the Airport
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search by date, location, or creator..."
            className="w-full max-w-xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All Active</TabsTrigger>
            <TabsTrigger value="my">My Rides</TabsTrigger>
            <TabsTrigger value="expired">History</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {activeRides.length === 0 ? (
              <EmptyState message="No active rides available. Be the first to create one!" />
            ) : (
              activeRides
                .filter(r => r.creator && r.participants)
                .map(ride => (
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
              expiredRides.map(ride => (
                <RideCard
                  key={ride._id}
                  ride={ride}
                  onOpenChat={setActiveChatRide}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* CHAT PANEL */}
      {activeChatRide && (
        <ChatPanel
          rideId={activeChatRide}
          onClose={() => setActiveChatRide(null)}
        />
      )}
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
