import React from 'react';
import { Ride } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Calendar, Users, MessageCircle, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { useRides } from '@/contexts/RideContext';
import { AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';
import { useState } from 'react';
interface RideCardProps {
  ride: Ride;
  onOpenChat: (rideId: string) => void;
}

export function RideCard({ ride, onOpenChat }: RideCardProps) {
  const { user } = useAuth();
  const { joinRide, leaveRide , deleteRide, unread } = useRides();

  if (
    !ride ||
    !ride._id ||
    !ride.creator ||
    typeof ride.creator._id !== 'string' ||
    !Array.isArray(ride.participants)
  ) {
    return null;
  }

  const isExpired = new Date(ride.departureTime) <= new Date();
  const isCreator = !!user && ride.creator._id === user.id;
  const isParticipant =
    !!user && ride.participants.some(p => p && p._id === user.id);

  let creatorName = 'Unknown';
  if (typeof ride.creator.email === 'string') {
    creatorName = ride.creator.email
      .split('mit')[0]
      .replace(/\d+/g, '')
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  let formattedDate = '—';
  if (typeof ride.date === 'string') {
    const parsed = parseISO(ride.date);
    if (isValid(parsed)) {
      formattedDate = format(parsed, 'EEE, MMM d, yyyy');
    }
  }

  let formattedTime = '—';
  if (typeof ride.departureTime === 'string') {
    const parsed = parseISO(ride.departureTime);
    if (isValid(parsed)) {
      formattedTime = format(parsed, 'hh:mm a');
    }
  }

  const destinationLabel =
    ride.destination === 'airport'
      ? 'Airport'
      : ride.destination === 'campus'
      ? 'Campus'
      : '—';

  const canJoin =
    !!user &&
    !isExpired &&
    !isCreator &&
    !isParticipant &&
    ride.participants.length < 4;

  const handleJoinRide = async () => {
    try {
      await joinRide(ride._id);
      toast.success('Joined Ride');
    } catch (err: any) {
      toast.error(err?.message || 'Unable to join ride');
    }
  };

  const handleLeaveRide = async () => {
    try {
      await leaveRide(ride._id);
      toast.success('Left Ride');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Error leaving ride';
      toast.error(message);
    }
  };


  const handleDeleteRide = async () => {
    if (!confirm('Delete this ride permanently?')) return;

    try {
      await deleteRide(ride._id);
      toast.success('Ride deleted');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Deleting failed';
      toast.error(message);
    }
  };

  const [showReport, setShowReport] = useState(false);

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-foreground">
                {isExpired
                  ? 'Expired Ride'
                  : isParticipant
                  ? 'Active Ride'
                  : 'Available Ride'}
              </h3>
              {isCreator && (
                <Badge variant="secondary" className="text-xs">
                  Creator
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Posted by <span className="font-medium">{creatorName}</span>
            </p>
          </div>

          {(isParticipant || isCreator) && !isExpired && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onOpenChat(ride._id)}
              className="relative bg-slate-900 hover:bg-slate-800 text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Group Chat

              {unread?.[ride._id] && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Button>
          )}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p className="text-sm font-medium">{formattedDate}</p>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
            <p className="text-sm font-medium">{formattedTime}</p>
          </div>
        </div>

        {/* Destination */}
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm text-muted-foreground">Destination</p>
            <p className="text-sm font-medium">{destinationLabel}</p>
          </div>
        </div>

        {/* Flight Details */}
        {/* {ride.flightDetails && (
          <div className="bg-muted/40 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">
              Flight Details
            </p>
            <p className="text-sm font-medium">{ride.flightDetails}</p>
          </div>
        )} */}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">
              {ride.participants.length}/4 participants
            </span>
          </div>

          <div className="flex gap-2">
            {(isParticipant || isCreator) && !isExpired && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={() => setShowReport(true)}
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Report
              </Button>
            )}

            {canJoin && (
              <Button variant="gradient" size="sm" onClick={handleJoinRide}>
                Join Ride
              </Button>
            )}

            {isCreator && !isExpired && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteRide}
              >
                Delete Ride
              </Button>
            )}

            {isParticipant && !isCreator && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleLeaveRide}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Leave Ride
              </Button>
            )}
          </div>
        </div>
      </div>
      {showReport && user && (
        <ReportModal
          ride={ride}
          currentUserId={user.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </Card>
  );
}
