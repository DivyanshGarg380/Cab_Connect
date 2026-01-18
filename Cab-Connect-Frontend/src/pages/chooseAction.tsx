import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CarTaxiFront,
  Users,
  ArrowRight,
  CalendarClock,
  MapPin,
} from "lucide-react";

type Destination = "airport" | "campus";

export default function ChooseAction() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState<Destination>("airport");
  const [departureTime, setDepartureTime] = useState("");

  const onJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!departureTime) return;

    const params = new URLSearchParams();
    params.set("mode", "join");
    params.set("destination", destination);
    params.set("departureTime", new Date(departureTime).toISOString());

    navigate(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* background blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-300/20 rounded-full blur-3xl" />
      <div className="absolute top-16 -right-24 w-96 h-96 bg-sky-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-violet-200/20 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur-md shadow-sm">
              <span className="text-sm font-medium text-gray-700">
                Cab Connect • College Ride Sharing
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mt-6 text-gray-900 tracking-tight">
              Split rides, not chaos.
            </h1>

            <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
              Create a cab ride or join one instantly. Smart recommendations help
              you match with rides based on destination and departure time.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Ride */}
            <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition overflow-hidden h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Create a Ride</h2>
                    <p className="text-gray-600 mt-2">
                      Post your ride to Airport/MIT and let others join.
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                    <CarTaxiFront className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">How it works</p>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      <li>• Create a ride with destination & departure time</li>
                      <li>• Others can discover and request to join</li>
                      <li>• You approve & split seats easily</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-5">
                    <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3">
                      <p className="text-xs text-gray-500">Best for</p>
                      <p className="text-sm font-semibold text-gray-900">Airport trips</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white/60 px-4 py-3">
                      <p className="text-xs text-gray-500">Safety</p>
                      <p className="text-sm font-semibold text-gray-900">College-only</p>
                    </div>
                  </div>
                </div>

                <button
                  className="mt-auto w-full rounded-xl py-3 font-semibold bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="h-1 w-full bg-indigo-500/40" />
            </div>

            {/* Join Ride */}
            <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition overflow-hidden h-full">
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Join a Ride</h2>
                    <p className="text-gray-600 mt-2">
                      Enter destination & time, we’ll recommend best rides.
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>

                <form className="mt-5 space-y-3" onSubmit={onJoin}>
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      Destination
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value as Destination)}
                    >
                      <option value="airport">Airport</option>
                      <option value="campus">Campus</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-gray-500" />
                      Departure time
                    </label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required
                    />
                  </div>

                  <p className="text-xs text-gray-500 pt-1 pb-9">
                    Recommended rides will appear at the top of Dashboard.
                  </p>

                  <button
                    type="submit"
                    className="mt-6 w-full rounded-xl py-3 font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    Find Matching Rides
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* IMPORTANT: pushes everything above up so button aligns */}
                <div className="mt-auto" />
              </div>
            </div>

          </div>
          {/* Footer */}
          <div className="text-center mt-10 text-sm text-gray-500">
            Secure OTP login • Real-time rides • Moderated community
          </div>
        </div>
      </div>
    </div>
  );
}
