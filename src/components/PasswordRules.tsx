// Mirrors the backend Identity password policy (Program.cs) — keep in sync.
const RULES = [
  { label: "At least 10 characters", test: (p: string) => p.length >= 10 },
  { label: "An uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "A digit", test: (p: string) => /[0-9]/.test(p) },
  { label: "A special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function isValidPassword(password: string) {
  return RULES.every((rule) => rule.test(password));
}

export default function PasswordRules({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.label}
            className={`flex items-center gap-2 ${ok ? "text-green-700" : "text-gray-500"}`}
          >
            <span className="w-4 text-center">{ok ? "✓" : "○"}</span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
