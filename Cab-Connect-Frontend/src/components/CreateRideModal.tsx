import React, { useState } from 'react';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, Plane, Plus, MapPin, ChevronDown  } from 'lucide-react';
import { toast } from 'sonner';

export function CreateRideModal() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [flightDetails, setFlightDetails] = useState('');
  const { createRide } = useRides();
  const [destination, setDestination] = useState<'airport' | 'campus'>('airport');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedDate = new Date(`${date}T${time}`);
    if (selectedDate < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    try {
      await createRide(date, time, destination);
      toast.success('Ride created successfully');
      setOpen(false);
      setDate('');
      setTime('');
      setFlightDetails('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ride');
    }
  };

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

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
              <MapPin className="w-4 h-4 inline mr-2" />
              Destination
            </label>
            <select
              value={destination}
              onChange={(e) =>
                setDestination(e.target.value as 'airport' | 'campus')
              }
              className="input-styled"
              required
            >
              <option value="airport">Airport (IXE)</option>
              <option value="campus">Campus</option>
            </select>
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
