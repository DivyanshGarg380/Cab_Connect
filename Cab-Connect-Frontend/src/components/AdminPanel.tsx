import React, { useState } from 'react';
import { useRides } from '@/contexts/RideContext';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Trash2, Shield, Calendar, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function AdminPanel() {
  const { rides, deleteRide } = useRides();
  const { user } = useAuth();
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const sortedRides = [...rides].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDelete = (rideId: string) => {
    deleteRide(rideId);
    setSelectedRideId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/20 text-success border-success/30';
      case 'expired': return 'bg-muted text-muted-foreground border-muted';
      case 'full': return 'bg-warning/20 text-warning border-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage all ride requests</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{rides.length}</p>
              <p className="text-xs text-muted-foreground">Total Rides</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-success" />
            <div>
              <p className="text-2xl font-bold">{rides.filter(r => r.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-warning" />
            <div>
              <p className="text-2xl font-bold">{rides.filter(r => r.status === 'full').length}</p>
              <p className="text-xs text-muted-foreground">Full</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{rides.filter(r => r.status === 'expired').length}</p>
              <p className="text-xs text-muted-foreground">Expired</p>
            </div>
          </div>
        </div>

        {/* Rides Table */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Ride Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Flight</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No rides found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(new Date(ride.date), 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{ride.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ride.creatorName}</p>
                          <p className="text-sm text-muted-foreground">{ride.creatorEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {ride.flightDetails || <span className="text-muted-foreground">—</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{ride.participants.length}/4</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(ride.status)}>
                          {ride.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Ride?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the ride created by {ride.creator} on {format(new Date(ride.date), 'MMM dd, yyyy')}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(ride.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
