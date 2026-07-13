import { Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OverviewPage from "@/pages/OverviewPage";
import CalendarPage from "@/pages/CalendarPage";
import BookingsPage from "@/pages/BookingsPage";
import ContactsPage from "@/pages/ContactsPage";
import FieldsPage from "@/pages/FieldsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-fkb-bg">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/fields" element={<FieldsPage />} />
        </Routes>
      </main>
    </div>
  );
}
