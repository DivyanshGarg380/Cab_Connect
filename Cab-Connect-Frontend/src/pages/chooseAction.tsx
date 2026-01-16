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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* background blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-teal-300/30 rounded-full blur-3xl" />
      <div className="absolute top-16 -right-24 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-emerald-200/20 rounded-full blur-3xl" />

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
            <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Create a Ride
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Post your ride to Airport/MIT and let others join.
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center shadow-sm">
                    <CarTaxiFront className="w-6 h-6 text-white" />
                  </div>
                </div>

                <button
                  className="mt-6 w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-gray-900 to-gray-800 text-white hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="h-1 w-full bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-400 opacity-60" />
            </div>

            {/* Join Ride */}
            <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-xl shadow-sm hover:shadow-md transition overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Join a Ride
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Enter destination & time, we’ll recommend best rides.
                    </p>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center shadow-sm">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>

                <form className="mt-5 space-y-3" onSubmit={onJoin}>
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Destination
                    </label>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                      value={destination}
                      onChange={(e) =>
                        setDestination(e.target.value as Destination)
                      }
                    >
                      <option value="airport">Airport</option>
                      <option value="campus">Campus</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CalendarClock className="w-4 h-4" />
                      Departure time
                    </label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-teal-500"
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-95 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    Find Matching Rides
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-xs text-gray-500 mt-3">
                  Recommended rides will appear at the top of Dashboard.
                </p>
              </div>

              <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-400 opacity-60" />
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
