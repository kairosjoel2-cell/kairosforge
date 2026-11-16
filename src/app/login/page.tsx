"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (mode === "login") {
        const r = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Login failed.");
        router.replace("/dashboard");
      } else if (mode === "register") {
        const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, name }) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Registration failed.");
        router.replace("/dashboard");
      } else {
        const r = await fetch("/api/auth/recover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, newPassword: password }) });
        const d = await r.json();
        setNotice(d.message || d.error || "Request received.");
        if (!r.ok) setError(d.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md kf-card kf-glow p-8 kf-fade-up">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">KAIROSFORGE</h1>
          <p className="text-zinc-500 text-sm mt-1">Describe it. Generate it. Build it.</p>
        </div>

        <div className="flex gap-2 mb-6 text-sm">
          {(["login", "register", "recover"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); setNotice(""); }}
              className={`flex-1 py-2 rounded-lg transition ${mode === m ? "bg-accent/20 text-white border border-accent/50" : "text-zinc-400 hover:text-white border border-transparent"}`}
            >
              {m === "login" ? "Sign in" : m === "register" ? "Create account" : "Reset password"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <input className="kf-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className="kf-input" type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode !== "recover" ? (
            <input className="kf-input" type="password" placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          ) : (
            <input className="kf-input" type="password" placeholder="New password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          )}

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}
          {notice && <p className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">{notice}</p>}

          <button className="kf-btn-primary w-full" disabled={busy}>
            {busy ? "Working…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500 mt-6">
          By continuing you agree to use KAIROSFORGE responsibly.
        </p>
      </div>
    </main>
  );
}