import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { X, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from "sonner";
import { socket } from '@/lib/socket';
interface ChatPanelProps {
  rideId: string;
  onClose: () => void;
}

export function ChatPanel({ rideId, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const { rides, messages, sendMessage, fetchMessages, clearUnread } = useRides();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [showMembers, setShowMembers] = useState(false);

  const handleKick = async (participantId: string) => {
    const res = await fetch(`http://localhost:5000/rides/${rideId}/kick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({ participantId }),
    });

    if (!res.ok) {
      toast.error("Kicking Failed");
      return;
    }

    setMembers(prev => prev.filter(m => m._id !== participantId));
    toast.success("User Removed");
    setShowMembers(false);
  };

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  const ride = rides.find(r => r._id === rideId);
  const isCreator = user.id === ride.creator._id;
  const rideMessages = messages?.[rideId] ?? [];
  if(!user || !ride) return null;

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchRideMembers = async () => {
      const res = await fetch(`http://localhost:5000/rides/${rideId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await res.json();
      setMembers(data.ride.participants);
    };

    fetchRideMembers();
  }, [rideId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rideMessages]);

  useEffect(() => {
    fetchMessages(rideId);
    clearUnread(rideId);
  }, [rideId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      if (
        e.key === '/' &&
        !(document.activeElement instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    socket.on("ride:kicked", ({ rideId: kickedRideId }) => {
      if (kickedRideId === rideId) {
        toast.error("You were removed from this ride");
        onClose();
      }
    });

    return () =>{ socket.off("ride:kicked"); };
  }, [rideId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(rideId, newMessage);
      setNewMessage('');
    }
  };


  if (!ride) return null;

 return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      />

      {/* Chat Modal */}
      <div className={`
        relative w-full max-w-md h-[80vh]
        bg-card border border-border rounded-xl shadow-xl
        flex flex-col
        transition-all duration-200 ease-out
        ${isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Group Chat</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMembers(true)}
              >
                <Users className="w-4 h-4 mr-1" />
                Members
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

       {showMembers && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card w-[520px] rounded-xl p-5 shadow-xl">
              
              {/* Header */}
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h4 className="font-semibold text-lg">
                  Ride Members ({members.length})
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMembers(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Members List */}
              <div className="border rounded-lg divide-y">
                {members.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition"
                  >
                    {/* Email */}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[360px]">
                        {p.email}
                      </span>
                      {p._id === ride.creator._id && (
                        <span className="text-xs text-primary">Creator</span>
                      )}
                    </div>

                    {/* Action */}
                    {isCreator && p._id !== ride.creator._id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8"
                        onClick={() => handleKick(p._id.toString())}
                      >
                        Kick User
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {rideMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            rideMessages.map(msg => {
              if(msg.type === 'system' ){
                return (
                  <div key = {msg._id} className='flex justify-center'>
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isOwn = msg.sender._id === user.id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-secondary text-secondary-foreground rounded-bl-md'
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium opacity-70 mb-1">
                        {msg.sender?.email}
                      </p>
                    )}
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              ref = {inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="
                flex-1 input-styled py-2
                outline-none
                focus:outline-none
                focus:ring-0
                focus-visible:ring-0
                focus:border-transparent
              "
            />
            <Button type="submit" size="icon" variant="gradient" disabled={!newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}
