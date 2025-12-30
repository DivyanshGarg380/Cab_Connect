import React from 'react';
import { Ride } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plane, Users, MessageCircle, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RideCardProps {
  ride: Ride;
  onOpenChat: (rideId: string) => void;
}

export function RideCard({ ride, onOpenChat }: RideCardProps) {
  const { user } = useAuth();

  const isExpired = ride.status === 'expired';
  const isCreator = user?.id === ride.creator._id;
  const isParticipant = ride.participants.some(
    (p) => p._id === user?.id
  );

  const creatorName = ride.creator.email
    .split('@')[0]
    .replace(/\d+/g, '')
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const formattedDate = format(parseISO(ride.date), 'EEE, MMM d, yyyy');

  return (
    <div
      className={`card-elevated p-5 ${
        isExpired ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col gap-4">
        {/* Status */}
        <div className="flex gap-2">
          <span className="badge-status badge-active">
            {ride.status === 'expired' ? 'Expired' : 'Active'}
          </span>
          {isCreator && (
            <span className="badge-status bg-primary/10 text-primary">
              Your Ride
            </span>
          )}
          {isParticipant && (
            <span className="badge-status badge-joined">
              You Joined
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

        {/* Date */}
        <div className="flex items-center gap-2 text-foreground">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="font-medium">{formattedDate}</span>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {ride.participants.length}/{ride.maxParticipants} participants
          </span>
        </div>

        {/* Actions */}
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