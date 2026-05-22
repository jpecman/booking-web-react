import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Bookings", to: "/bookings" },
  { label: "Contacts", to: "/contacts" },
  { label: "Fields", to: "/fields" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, logout } = useAuth();

  return (
    <>
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-16 items-center justify-between">
            <span className="text-xl font-bold text-indigo-600">BookingApp</span>

            {/* Desktop links */}
            <ul className="hidden md:flex gap-6">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `font-medium transition-colors ${isActive ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600"}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Auth — desktop */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>

            {/* Hamburger button */}
            <button
              className="md:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-2 flex flex-col gap-1">
            <ul>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `block py-2 font-medium transition-colors ${isActive ? "text-indigo-600" : "text-gray-600 hover:text-indigo-600"}`
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="border-t pt-2 mt-1">
              {user ? (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-gray-600 hover:text-indigo-600"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setShowLogin(true); setMenuOpen(false); }}
                  className="w-full bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}
