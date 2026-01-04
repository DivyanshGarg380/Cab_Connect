import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { X, Send, Users } from 'lucide-react';
import { format } from 'date-fns';
interface ChatPanelProps {
  rideId: string;
  onClose: () => void;
}

export function ChatPanel({ rideId, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const { rides, messages, sendMessage, fetchMessages, clearUnread } = useRides();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ride = rides.find(r => r._id === rideId);
  const participants = ride?.participants ?? [];
  const rideMessages = messages?.[rideId] ?? [];
  if(!user || !ride) return null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rideMessages]);

  useEffect(() => {
    fetchMessages(rideId);
    clearUnread(rideId);
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
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Chat Modal */}
      <div className="relative w-full max-w-md h-[80vh] bg-card border border-border rounded-xl shadow-xl flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">Group Chat</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              {participants.length} members
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Participants */}
        <div className="px-4 py-3 border-b border-border bg-secondary/30">
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <span
                key={p._id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-background border border-border"
              >
                {p.email}
                {p._id === ride.creator._id && (
                  <span className="ml-1 text-primary">★</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {rideMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            rideMessages.map(msg => {
              if(msg.type === 'system'){
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
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input-styled py-2"
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
