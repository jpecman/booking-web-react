import { Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import OverviewPage from "@/pages/OverviewPage";
import BookingsPage from "@/pages/BookingsPage";
import ContactsPage from "@/pages/ContactsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
        </Routes>
      </main>
    </div>
  );
}
