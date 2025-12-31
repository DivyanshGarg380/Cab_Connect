import React from 'react';
import { Ride } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar, Users, MessageCircle, Clock, Plane } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { setHours, setMinutes } from 'date-fns';

interface RideCardProps {
  ride: Ride;
  onOpenChat: (rideId: string) => void;
}

export function RideCard({ ride, onOpenChat }: RideCardProps) {
  const { user } = useAuth();

  if (
    !ride ||
    !ride._id ||
    !ride.creator ||
    typeof ride.creator._id !== 'string' ||
    !Array.isArray(ride.participants)
  ) {
    return null;
  }

  const isExpired = ride.status === 'expired';
  const isCreator = !!user && ride.creator._id === user.id;
  const isParticipant =
    !!user && ride.participants.some(p => p && p._id === user.id);

  let creatorName = 'Unknown';
  if (typeof ride.creator.email === 'string') {
    creatorName = ride.creator.email
      .split('@')[0]
      .replace(/\d+/g, '')
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  let formattedDateTime = '—';

  if (typeof ride.departureTime === 'string') {
    try {
      const parsed = parseISO(ride.departureTime);
      if (isValid(parsed)) {
        formattedDateTime = format(parsed, 'EEE, MMM d • hh:mm a');
      }
    } catch {}
  }

  const destinationLabel =
   ride.destination === 'airport'
    ? 'Airport'
    : ride.destination === 'campus'
    ? 'Campus'
    : '—';

  return (
    <div className={`card-elevated p-5 ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex flex-col gap-4">

        {/* Status */}
        <div className="flex gap-2">
          <span className="badge-status badge-active">
            {isExpired ? 'Expired' : 'Active'}
          </span>
          {isCreator && (
            <span className="badge-status bg-primary/10 text-primary">
              Your Ride
            </span>
          )}
        </div>

        {/* Creator */}
        <p className="text-sm text-muted-foreground">
          Posted by{' '}
          <span className="font-medium text-foreground">
            {creatorName}
          </span>
        </p>

        {/* Date and Time*/}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formattedDateTime}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Destination: {destinationLabel}
          </span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {ride.participants.length}/4 participants
          </span>
        </div>

        {/* Action */}
        {!isExpired && isParticipant && (
          <Button
            size="sm"
            className="gap-2"
            onClick={() => onOpenChat(ride._id)}
          >
            <MessageCircle className="w-4 h-4" />
            Open Chat
          </Button>
        )}
      </div>
    </div>
  );
}
