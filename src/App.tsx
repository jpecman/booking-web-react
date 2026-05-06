import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

// Replace with your actual API types
interface Booking {
  id: string;
  title: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled";
}

export default function App() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useFetch<Booking[]>(
    () => api.get("/v1/booking"),
    [],
    { enabled: !!user, lazy: true }
  );

  const statusClass = (status: Booking["status"]) => {
    if (status === "confirmed") return "bg-green-100 text-green-800";
    if (status === "cancelled") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bookings</h1>
          <div className="flex gap-2">
            {import.meta.env.DEV && (
              <button
                onClick={() => console.log({ user, data, loading, error })}
                className="bg-gray-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Log state
              </button>
            )}
            <button
              onClick={refetch}
              disabled={!user || loading}
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Loading…" : "Reload"}
            </button>
          </div>
        </div>

        {!user && <p className="text-gray-500">Sign in to view your bookings.</p>}

        {loading && <p className="text-gray-500">Loading...</p>}

        {error && (
          <p className="text-red-600">Failed to load bookings: {error.message}</p>
        )}

        {data && data.length === 0 && (
          <p className="text-gray-500">No bookings found.</p>
        )}

        {data && data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {data.map((booking) => (
              <li
                key={booking.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4"
              >
                <strong className="flex-1">{booking.title}</strong>
                <span className="text-gray-500 text-sm">{booking.date}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(booking.status)}`}>
                  {booking.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
