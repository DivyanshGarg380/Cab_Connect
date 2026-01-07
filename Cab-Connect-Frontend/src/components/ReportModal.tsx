import React, { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

export default function ReportModal({ ride, currentUserId, onClose }){
    const [reportedUserId, setReportedUserId] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if(!reportedUserId  || description.length < 30){
            toast.error("Fill all fields (min 30 chars description)");
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-3">Report User</h2>

            {/* USER DROPDOWN */}
            <select
            className="w-full border p-2 rounded mb-3"
            value={reportedUserId}
            onChange={(e) => setReportedUserId(e.target.value)}
            >
            <option value="">Select user</option>
            {ride.participants
                .filter(p => p._id !== currentUserId)
                .map(p => (
                <option key={p._id} value={p._id}>
                    {p.email}
                </option>
                ))}
            </select>

            {/* RIDE INFO */}
            <div className="text-sm text-muted-foreground mb-3">
            <p> {ride.destination}</p>
            <p> {ride.date}</p>
            </div>

            {/* DESCRIPTION */}
            <textarea
            className="w-full border p-2 rounded mb-3"
            rows={4}
            placeholder="What happened? (min 30 characters)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
            </Button>
            </div>
        </div>
        </div>
    );
}