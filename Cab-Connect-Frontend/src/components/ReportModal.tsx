import React, { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

export default function ReportModal({ ride, currentUserId, onClose }){
    const [reportedUserId, setReportedUserId] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if(!reportedUserId || description.length === 0){
            toast.error("Fill all fields plz");
            return;
        }

        if(description.length > 30){
            toast.error("Message can be only 30 characters long");
            return;
        }

        const token = localStorage.getItem("accessToken");
        if(!token) return;

        try{
            setLoading(true);
            const res = await fetch("http://localhost:5000/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rideId: ride._id,
                    reportedUserEmail: ride.participants.find(
                        p => p._id === reportedUserId
                    )?.email,
                    description,
                }),
            });

            const data = await res.json();
            if(!res.ok) throw new Error(data.message);

            toast.success("Report submitted");
            onClose();
        }catch(err){
            toast.error(err.message || "Failed to submit report");
        }finally{
            setLoading(true);
        }
    };

     return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
        <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Report User</h2>
            </div>

            <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
            >
                <X className="w-4 h-4" />
            </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">

            {/* Ride Context */}
            <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <p className="font-medium">Ride Information</p>
                <p className="text-muted-foreground capitalize">
                Destination: {ride.destination}
                </p>
                <p className="text-muted-foreground">
                Date: {ride.date}
                </p>
            </div>

            {/* User Select */}
            <div>
                <label className="text-sm font-medium mb-1 block">
                User to report
                </label>
                <select
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.target.value)}
                >
                <option value="">Select a user</option>
                {ride.participants
                    .filter((p) => p._id !== currentUserId)
                    .map((p) => (
                    <option key={p._id} value={p._id}>
                        {p.email}
                    </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div>
                <label className="text-sm font-medium mb-1 block">
                What happened?
                </label>
                <textarea
                rows={4}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Describe the issue clearly (minimum 30 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                {description.length}/30 characters
                </p>
            </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>

            <Button
                variant="destructive"
                disabled={loading}
                onClick={handleSubmit}
            >
                {loading ? "Submitting..." : "Submit Report"}
            </Button>
            </div>
        </div>
    </div>
  );
}