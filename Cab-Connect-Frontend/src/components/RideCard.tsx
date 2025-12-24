import React from 'react';
import { RideRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plane, Users, MessageCircle, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RideCardProps {
  ride: RideRequest;
  onOpenChat: (rideId: string) => void;
}

export function RideCard({ ride, onOpenChat }: RideCardProps) {
  const { user } = useAuth();
  const { joinRide, leaveRide, isParticipant, canJoinOrLeave, getJoinLeaveCount } = useRides();

  const isExpired = ride.status === 'expired';
  const isFull = ride.status === 'full';
  const isUserParticipant = isParticipant(ride.id);
  const isCreator = user?.id === ride.creatorId;
  const canAction = canJoinOrLeave(ride.id);
  const actionCount = getJoinLeaveCount(ride.id);
  const remainingActions = 3 - actionCount;

  const formattedDate = format(parseISO(ride.date), 'EEE, MMM d, yyyy');
  const formattedTime = format(new Date(`2000-01-01T${ride.time}`), 'h:mm a');

  return (
    <div className={`card-elevated p-5 animate-fade-in ${isExpired ? 'opacity-60' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex-1">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            {isExpired && (
              <span className="badge-status badge-expired">Expired</span>
            )}
            {isFull && !isExpired && (
              <span className="badge-status bg-warning/15 text-warning">Full</span>
            )}
            {!isExpired && !isFull && (
              <span className="badge-status badge-active">Active</span>
            )}
            {isUserParticipant && (
              <span className="badge-status badge-joined">You're In</span>
            )}
            {isCreator && (
              <span className="badge-status bg-primary/10 text-primary">Your Ride</span>
            )}
          </div>

          {/* Creator Info */}
          <p className="text-sm text-muted-foreground mb-2">
            Posted by <span className="font-medium text-foreground">{ride.creatorName}</span>
          </p>

          {/* Date & Time */}
          <div className="flex flex-wrap gap-4 mb-3">
            <div className="flex items-center gap-2 text-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-medium">{formattedTime}</span>
            </div>
          </div>

          {/* Flight Details */}
          {ride.flightDetails && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Plane className="w-4 h-4" />
              <span>{ride.flightDetails}</span>
            </div>
          )}

          {/* Participants */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {ride.participants.length}/{ride.maxParticipants} participants
            </span>
            <div className="flex -space-x-2 ml-2">
              {ride.participants.slice(0, 4).map((p, i) => (
                <div
                  key={p.userId}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-medium text-primary"
                  title={p.userName}
                >
                  {p.userName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          {!isExpired && (
            <>
              {isUserParticipant ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                    onClick={() => onOpenChat(ride.id)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    Group Chat
                  </Button>
                  {!isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => leaveRide(ride.id)}
                      disabled={!canAction}
                    >
                      <UserMinus className="w-4 h-4" />
                      Leave
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="gradient"
                  size="sm"
                  className="gap-2"
                  onClick={() => joinRide(ride.id)}
                  disabled={isFull || !canAction}
                >
                  <UserPlus className="w-4 h-4" />
                  Join Ride
                </Button>
              )}
              
              {actionCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground justify-center">
                  <AlertCircle className="w-3 h-3" />
                  {remainingActions} action{remainingActions !== 1 ? 's' : ''} left
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
