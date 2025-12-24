import React, { useState } from 'react';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Plane, Plus } from 'lucide-react';
import { toast } from 'sonner';

export function CreateRideModal() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [flightDetails, setFlightDetails] = useState('');
  const { createRide } = useRides();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedDate = new Date(`${date}T${time}`);
    if (selectedDate < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    createRide(date, time, flightDetails || undefined);
    setOpen(false);
    setDate('');
    setTime('');
    setFlightDetails('');
  };

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Ride Request
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plane className="w-5 h-5 text-primary" />
            Create New Ride Request
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Travel Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              className="input-styled"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Departure Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-styled"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Time you want to leave for the airport
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Plane className="w-4 h-4 inline mr-2" />
              Flight Details (Optional)
            </label>
            <input
              type="text"
              value={flightDetails}
              onChange={(e) => setFlightDetails(e.target.value)}
              placeholder="e.g., AI-302 to Delhi"
              className="input-styled"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1">
              Create Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
