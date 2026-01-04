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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Trash2, Shield, Calendar, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Ride } from '@/types';
import { UserX } from "lucide-react";
import { ShieldX } from 'lucide-react';

export function AdminPanel() {
  const { rides, deleteRideAdmin } = useRides();
  const { user } = useAuth();
  
  // Not needed but still doing for security purposes
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Access denied. Admins only.
        </p>
      </div>
    );
  }

  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);

  const activeRides = rides.filter(
    r => r.status === 'open' || r.status === 'full'
  );

  const sortedRides = [...activeRides].sort((a, b) => 
    new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime()
  );

  const [deletedRides, setDeletedRides] = useState<Ride[]>([]);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const handleDelete = async (ride: Ride) => {
    setDeletedRides(prev => [...prev, ride]);
    await deleteRideAdmin(ride._id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-success/20 text-success border-success/30';
      case 'full':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'expired':
        return 'bg-muted text-muted-foreground border-muted';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDisplayName = (email: string) => {
    const localPart = email.split('mit')[0];

    return localPart
      .replace(/\d+/g, '')               
      .replace(/[._]/g, ' ')            
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const displayRides = activeTab === 'active' ? sortedRides : deletedRides;

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
              <p className="text-2xl font-bold">{rides.filter(r => r.status === 'open').length}</p>
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
              <ShieldX className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{deletedRides.length}</p>
                <p className="text-xs text-muted-foreground">Removed</p>
              </div>
            </div>
        </div>

        {/* Rides Table */}
        <div className="card-elevated overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">All Ride Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 mb-4 pt-3">
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveTab('active')}
              >
                Active Rides
              </Button>

              <Button
                variant={activeTab === 'history' ? 'default' : 'outline'}
              onClick={() => setActiveTab('history')}
              >
                Deleted History
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayRides.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {activeTab === 'active'
                        ? 'No active rides'
                        : 'No deleted rides'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  displayRides.map((ride) => (
                    <TableRow key={ride._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(new Date(ride.date), 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-muted-foreground"> {format(new Date(ride.departureTime), 'hh:mm a')}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{getDisplayName(ride.creator.email)}</p>
                          <p className="text-sm text-muted-foreground">{ride.creator.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {ride.destination}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <Dialog>
                            <DialogTrigger asChild>
                              <button  className="
                                  text-sm
                                  text-primary
                                  hover:underline
                                  cursor-pointer
                                  focus:outline-none
                              ">
                                {ride.participants.length}/4
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[85vh] overflow-visible">
                              <DialogHeader>
                                <DialogTitle>Ride Participants</DialogTitle>
                              </DialogHeader>

                              {ride.participants.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  No participants in this ride
                                </p>
                              ) : (
                                <div className="border rounded-md overflow-hidden mt-2">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead >Role</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                      </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                      {ride.participants.map((p) => {
                                        const isOwner = p._id === ride.creator._id;

                                        return (
                                          <TableRow
                                            key={p._id}
                                            className={isOwner ? "bg-primary/5" : ""}
                                          >
                                            <TableCell className="font-medium">
                                              {getDisplayName(p.email)}
                                            </TableCell>

                                            <TableCell className="text-muted-foreground">
                                              {p.email}
                                            </TableCell>

                                            <TableCell className="text-center">
                                              {isOwner ? (
                                                <Badge variant="default">Owner</Badge>
                                              ) : (
                                                <Badge variant="secondary">Passenger</Badge>
                                              )}
                                            </TableCell>

                                            <TableCell className="text-right">
                                              {!isOwner && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  // onClick={() => banUser(p._id)}
                                                  className="
                                                    text-muted-foreground
                                                    hover:text-destructive
                                                    hover:bg-destructive/10
                                                    transition
                                                  "
                                                >
                                                  <UserX className="w-4 h-4 mr-1" />
                                                  Ban
                                                </Button>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className = {
                          activeTab === 'history' ? 'bg-destructive/10 text-destructive border-destructive/30'
                                                  : getStatusColor(ride.status)
                        }>
                          {activeTab === 'history'
                              ? 'Removed'
                              : ride.status
                          }
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
                                This will permanently delete the ride created by {ride.creator.email} on {format(new Date(ride.date), 'MMM dd, yyyy')}. 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(ride)}
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
