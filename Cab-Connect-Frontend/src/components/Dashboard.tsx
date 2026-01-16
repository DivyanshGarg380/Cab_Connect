import React, { useState, useMemo, useEffect } from 'react';
import { useRides } from '@/contexts/RideContext';
import { Header } from './Header';
import { CreateRideModal } from './CreateRideModal';
import { RideCard } from './RideCard';
import { ChatPanel } from './ChatPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Calendar, Users, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { searchPanel } from "@/utils/searchPanel";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from 'react-router-dom';


export function Dashboard() {
  const { rides } = useRides();
  const [activeChatRide, setActiveChatRide] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [notification, setNotification] = useState<any>(null);

  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode");
  const joinDestination = searchParams.get("destination");
  const joinDepartureTime = searchParams.get("departureTime");

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const suggestionIds = useMemo(() => {
    return new Set(suggestions.map((r) => r._id));
  }, [suggestions]);

  // searching part
  const [searchQuery, setSearchQuery] = useState('');

  const { user }  = useAuth();
  const now = new Date();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (mode !== "join") return;
      if (!joinDestination || !joinDepartureTime) return;

      try {
        setSuggestionsLoading(true);
        const token = localStorage.getItem("accessToken");

        const url = `http://localhost:5000/rides/suggestions?destination=${joinDestination}&departureTime=${encodeURIComponent(
          joinDepartureTime
        )}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        setSuggestions(data?.suggestions || []);
      } catch (err) {
        console.log("Suggestion fetch error:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [mode, joinDestination, joinDepartureTime]);

  const sortedRides = useMemo(() => {
    return [...rides]
      .filter(r => r.date && r.status)
      .sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1;
        if (b.status === 'open' && a.status !== 'open') return 1;

        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [rides]);

  const activeRides = useMemo(() => {
    return sortedRides.filter((r) => {
      return new Date(r.departureTime) > new Date();
    });
  }, [sortedRides]);

  const expiredRides = useMemo(() => {
    if(!user) return [];
    const now = new Date();
    return sortedRides.filter((r) => {
      if(!r.creator || !Array.isArray(r.participants)) return false;
      const isExpired = new Date(r.departureTime) <= now;

      const isMine = r.creator._id === user.id ||
                     r.participants.some((p) => p._id === user.id);
      return isExpired && isMine;
    });
  }, [sortedRides, user]);

  const myRides = useMemo(() => {
    if (!user) return [];

    const now = new Date();

    return rides.filter((r) => {
      if (!r.creator || !Array.isArray(r.participants)) return false;

      const isMine =
        r.creator._id === user.id ||
        r.participants.some((p) => p._id === user.id);

      const isActive = new Date(r.departureTime) > now;

      return isMine && isActive;
    });
  }, [rides, user]);

  const fetchSuggestions = async () => {
    if (mode !== "join") return;
    if (!joinDestination || !joinDepartureTime) return;

    try {
      setSuggestionsLoading(true);
      const token = localStorage.getItem("accessToken");

      const url = `http://localhost:5000/rides/suggestions?destination=${joinDestination}&departureTime=${encodeURIComponent(
        joinDepartureTime
      )}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setSuggestions(data?.suggestions || []);
    } catch (err) {
      console.log("Suggestion fetch error:", err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "join") {
      fetchSuggestions();
    }
  }, [rides]);

  useEffect(() => {
    const fetchNotification = async () => {
      const res = await fetch('http://localhost:5000/notifications', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await res.json();
      if (data.notifications?.length > 0) {
        setNotification(data.notifications[0]);
      }
    };

    fetchNotification();
  }, []);

  const baseRides =
    activeTab === 'all'
      ? activeRides
      : activeTab === 'my'
      ? myRides
      : expiredRides;

  const searchedRides = useMemo(() => {
    return searchPanel(baseRides, searchQuery);
  }, [baseRides, searchQuery]);

  const displayRides = activeTab === 'all' ? activeRides : activeTab === 'my' ? myRides : expiredRides;

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
                  All rides go to and from the IXE Airport
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by DD/MM/YYYY, destination, or email..."
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
            {/* RECOMMENDED RIDES */}
            {mode === "join" && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Recommended Rides
                </h2>

                {suggestionsLoading ? (
                  <p className="text-gray-600">Finding best rides...</p>
                ) : suggestions.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-gray-800 font-medium">
                      No matching rides found
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      Try a different time window or create a new ride.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((ride) => (
                      <div
                        key={ride._id}
                        className="border border-teal-200 bg-teal-50 rounded-lg p-3"
                      >
                        <RideCard ride={ride} onOpenChat={setActiveChatRide} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {searchedRides.length === 0 ? (
              <EmptyState message="No rides match your search." />
            ) : (
              <AnimatePresence>
                {searchedRides.filter(r => r.creator && r.participants).filter(r => !suggestionIds.has(r._id)).map(ride => (
                  <motion.div
                    key={ride._id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <RideCard
                      ride={ride}
                      onOpenChat={setActiveChatRide}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
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

      {/* Kick Participant */}
      {notification && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-card w-96 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-3">
              {notification.message.includes("banned")
                ? "Report Update"
                : notification.message.includes("ride")
                ? "Ride Update"
                : "Notification"}
            </h3>

            <pre className="text-sm whitespace-pre-wrap mb-4">
              {notification.message}
            </pre>

            <Button
              className="w-full"
              onClick={async () => {
                await fetch(`http://localhost:5000/notifications/${notification._id}/read`, {
                  method: 'PATCH',
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                  },
                });
                setNotification(null);
              }}
            >
              OK
            </Button>
          </div>
        </div>
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


function Stat({ icon, value, label, sub }: any) {
  return (
    <div className="flex items-center space-x-4 bg-gray-50 rounded-lg p-6">
      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value ?? label}</p>
        <p className="text-sm text-gray-600">{sub ?? label}</p>
      </div>
    </div>
  );
}
