import { api } from "@/api/client";
import { useFetch } from "@/hooks/useFetch";

// Replace with your actual API types
interface Booking {
  id: string;
  title: string;
  date: string;
  status: "pending" | "confirmed" | "cancelled";
}

export default function App() {
  const { data, loading, error } = useFetch<Booking[]>(
    () => api.get("/bookings"),
    []
  );

  return (
    <main>
      <h1>Bookings</h1>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "red" }}>
          Failed to load bookings: {error.message}
        </p>
      )}

      {data && data.length === 0 && <p>No bookings found.</p>}

      {data && data.length > 0 && (
        <ul style={{ listStyle: "none", marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {data.map((booking) => (
            <li
              key={booking.id}
              style={{
                background: "#fff",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <strong>{booking.title}</strong>
              <span style={{ marginLeft: "1rem", color: "#666" }}>{booking.date}</span>
              <span
                style={{
                  marginLeft: "1rem",
                  fontSize: "0.8rem",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background:
                    booking.status === "confirmed"
                      ? "#d4edda"
                      : booking.status === "cancelled"
                      ? "#f8d7da"
                      : "#fff3cd",
                }}
              >
                {booking.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
