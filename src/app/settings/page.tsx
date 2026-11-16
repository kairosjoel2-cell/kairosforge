"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [gh, setGh] = useState<{ connected: boolean; login?: string; setup?: string } | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/user").then(async (r) => {
      if (!r.ok) return router.replace("/login");
      const u = await r.json();
      setUser(u);
      setName(u.name || "");
    });
    fetch("/api/github/export").then((r) => r.json()).then(setGh);
  }, [router]);

  async function saveProfile() {
    const r = await fetch("/api/user", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setMsg(r.ok ? "Profile saved." : ""); setErr(r.ok ? "" : "Save failed.");
  }

  async function connectGithub() {
    setErr(""); setMsg("");
    const r = await fetch("/api/github/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    const d = await r.json();
    if (r.ok) { setMsg("GitHub connected."); setGh({ connected: true, login: "connected" }); setToken(""); }
    else setErr(d.error || "Connection failed.");
  }

  async function disconnectGithub() {
    await fetch("/api/github/connect", { method: "DELETE" });
    setGh({ connected: false });
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-edge bg-panel/80 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">KAIROSFORGE</Link>
          <Link href="/dashboard" className="kf-btn-ghost text-sm">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>

        <section className="kf-card p-6">
          <h2 className="font-semibold mb-4">Profile</h2>
          <p className="text-sm text-zinc-500 mb-4">{user?.email}</p>
          <label className="text-sm text-zinc-400 block mb-1">Display name</label>
          <div className="flex gap-2">
            <input className="kf-input" value={name} onChange={(e) => setName(e.target.value)} />
            <button className="kf-btn-primary text-sm" onClick={saveProfile}>Save</button>
          </div>
        </section>

        <section className="kf-card p-6">
          <h2 className="font-semibold mb-2">GitHub Integration</h2>
          {gh === null ? <p className="text-sm text-zinc-500">Checking…</p> : gh.connected ? (
            <div>
              <p className="text-sm text-emerald-400 mb-3">✅ Connected{gh.login ? ` as ${gh.login}` : ""}</p>
              <button className="kf-btn-ghost text-sm" onClick={disconnectGithub}>Disconnect</button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-zinc-400 mb-3">{gh.setup || "Connect your GitHub account to enable one-click project export."}</p>
              <input className="kf-input mb-2" type="password" placeholder="GitHub personal access token (repo scope)" value={token} onChange={(e) => setToken(e.target.value)} />
              <button className="kf-btn-primary text-sm" onClick={connectGithub} disabled={!token}>Connect GitHub</button>
              <p className="text-xs text-zinc-500 mt-3">
                Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-accent underline">github.com/settings/tokens</a> with the <code className="text-zinc-300">repo</code> scope. It is stored server-side only and never exposed to your browser.
              </p>
            </div>
          )}
        </section>

        {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>
    </main>
  );
}