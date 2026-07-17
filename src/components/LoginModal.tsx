import { useState } from "react";
import { ApiError } from "@/api/client";
import { useAuth } from "@/context/AuthContext";
import PasswordRules, { isValidPassword } from "@/components/PasswordRules";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const { login, changePassword } = useAuth();
  const [step, setStep] = useState<"login" | "newPassword">("login");
  const [email, setEmail] = useState(
    import.meta.env.DEV ? import.meta.env.VITE_DEV_LOGIN_EMAIL ?? "" : ""
  );
  const [password, setPassword] = useState(
    import.meta.env.DEV ? import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? "" : ""
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      // 403 = the account's password was set by an admin and must be replaced.
      if (err instanceof ApiError && err.status === 403) {
        setStep("newPassword");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const canSubmitNewPassword =
    isValidPassword(newPassword) && newPassword === confirmPassword;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await changePassword(email, password, newPassword);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {step === "login" ? "Sign in" : "Choose a new password"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {step === "login" ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-fkb-mid text-white rounded-lg py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Your password was set by an administrator. Choose your own to continue.
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                required
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
            </div>

            <PasswordRules password={newPassword} />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fkb-mid"
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !canSubmitNewPassword}
              className="bg-fkb-mid text-white rounded-lg py-2 text-sm font-medium hover:bg-fkb-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Set password and sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
