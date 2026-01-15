import React, { useState } from 'react';
import { useRides } from '@/contexts/RideContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarIcon, Clock, Plane, Plus, MapPin, ChevronDown, PlaneTakeoff, Car, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; 

export function CreateRideModal() {
  const [open, setOpen] = useState(false);
  const { createRide } = useRides();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [flightDetails, setFlightDetails] = useState('');
  const [pickup, setPickup] = useState<'campus' | 'airport'>('campus');
  const [destination, setDestination] = useState<'airport' | 'campus'>('airport');

  const destinationIcon = destination === "airport" ? Plane : Building2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error('Please fill in all required fields');
      return;
    }

    const selectedDate = new Date(`${date}T${time}`);
    if (selectedDate < new Date()) {
      toast.error('Please select a future date and time');
      return;
    }

    try {
      await createRide(date, time, destination);
      toast.success('Ride created successfully');
      setDate('');
      setTime('');
      setFlightDetails('');
      setDestination('airport');
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ride');
    }
  };

  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Create Ride Request
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl top-[49%] translate-y-[-49%]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Create Ride Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">

          {/* Pickup Location Details*/}
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">MIT Manipal</span>

            <div className="flex items-center gap-2">
              <div className="w-10 h-px bg-border" />
              <Car className="w-4 h-4 text-muted-foreground" />
              <div className="w-10 h-px bg-border" />
            </div>

            <span className="font-medium text-foreground">
              Mangalore Airport (IXE)
            </span>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Time <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Destination <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDestination("airport")}
                className={`
                  flex items-center justify-center gap-2 h-11 rounded-md border text-sm
                  ${
                    destination === "airport"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }
                `}
              >
                <Plane className="w-4 h-4" />
                Airport (IXE)
              </button>
              <button
                type="button"
                onClick={() => setDestination("campus")}
                className={`
                  flex items-center justify-center gap-2 h-11 rounded-md border text-sm
                  ${
                    destination === "campus"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background"
                  }
                `}
              >
                <Building2 className="w-4 h-4" />
                Campus
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Select where the ride is headed
            </p>
          </div>

          {/* Flight Details */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Flight Details (Optional)
            </Label>
            <Textarea
              placeholder="e.g., AI-302 to Delhi"
              value={flightDetails}
              onChange={(e) => setFlightDetails(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* Info Box */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-sm text-teal-800">
              <span className="font-medium">Note:</span> You’ll be automatically
              added to the ride. Max 4 participants per ride.
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              variant='gradient'
            >
              Create Ride
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
