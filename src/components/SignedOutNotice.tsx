import { useState } from "react";
import LoginModal from "@/components/LoginModal";

export default function SignedOutNotice() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-4">
      <span className="text-4xl">🔒</span>
      <h1 className="text-xl font-bold text-fkb-dark">Nothing to see here… yet</h1>
      <p className="text-gray-500 max-w-sm">
        Your bookings are playing hide and seek, and they're winning. Sign in to find them.
      </p>
      <button
        onClick={() => setShowLogin(true)}
        className="bg-fkb-mid text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-fkb-hover transition-colors"
      >
        Sign in
      </button>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
