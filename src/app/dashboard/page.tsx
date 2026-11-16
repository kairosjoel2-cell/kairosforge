"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";

interface ProjectSummary { id: string; name: string; framework: string; updatedAt: string }

const SUGGESTIONS = [
  "Create a premium supermarket website with a black and red theme, product categories, shopping cart and responsive mobile layout.",
  "Create a modern SaaS landing page with pricing, testimonials and a strong CTA.",
  "Create an elegant restaurant website with a menu, reservations and gallery.",
  "Create a personal portfolio with a hero, project gallery and contact form.",
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [history, setHistory] = useState<{ id: string; prompt: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("html");
  const [theme, setTheme] = useState("dark");
  const [style, setStyle] = useState("modern");
  const [colors, setColors] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/user").then(async (r) => {
      if (!r.ok) return router.replace("/login");
      setUser(await r.json());
    });
    fetch("/api/projects").then(async (r) => { if (r.ok) setProjects(await r.json()); });
    fetch("/api/prompt-history").then(async (r) => { if (r.ok) setHistory(await r.json()); });
  }, [router]);

  async function generate() {
    if (!prompt.trim()) return;
    setBusy(true);
    setError("");
    setStep(0);
    const steps = ["Analyzing your description…", "Planning the structure…", "Writing the code…", "Assembling files…"];
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, steps.length - 1)), 4000);
    try {
      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, options: { mode, theme, style, colors } }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed.");
      clearInterval(timer);
      router.push(`/workspace/${d.projectId}`);
    } catch (e) {
      clearInterval(timer);
      setError(e instanceof Error ? e.message : "Generation failed.");
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  const filtered = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-edge bg-panel/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold tracking-tight bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">KAIROSFORGE</Link>
          <div className="flex items-center gap-3">
            <Link href="/templates" className="kf-btn-ghost text-sm hidden sm:block">Templates</Link>
            <Link href="/settings" className="kf-btn-ghost text-sm hidden sm:block">Settings</Link>
            <button onClick={logout} className="kf-btn-ghost text-sm">Log out</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="kf-fade-up">
          <h1 className="text-3xl sm:text-4xl font-bold">Your imagination deserves to be built.</h1>
          <p className="text-zinc-400 mt-2">Describe what you envision. Let KAIROSFORGE turn it into reality.</p>
        </div>

        {/* Prompt box */}
        <div className="mt-8 kf-card p-5 kf-glow kf-fade-up">
          <textarea
            className="kf-input min-h-28 resize-y"
            placeholder='e.g. "Create a premium supermarket website with a black and red theme, product categories, shopping cart and responsive mobile layout."'
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-3 mt-3">
            <select className="kf-input !w-auto !py-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value)} disabled={busy}>
              <option value="html">HTML / CSS / JavaScript</option>
              <option value="react">React</option>
              <option value="react-advanced">Advanced React</option>
            </select>
            <select className="kf-input !w-auto !py-2 text-sm" value={theme} onChange={(e) => setTheme(e.target.value)} disabled={busy}>
              <option value="dark">Dark theme</option>
              <option value="light">Light theme</option>
            </select>
            <select className="kf-input !w-auto !py-2 text-sm" value={style} onChange={(e) => setStyle(e.target.value)} disabled={busy}>
              <option value="modern">Modern</option>
              <option value="minimal">Minimal</option>
              <option value="premium">Premium</option>
              <option value="playful">Playful</option>
            </select>
            <input className="kf-input !w-auto !py-2 text-sm flex-1 min-w-40" placeholder="Color preferences (optional)" value={colors} onChange={(e) => setColors(e.target.value)} disabled={busy} />
            <button className="kf-btn-primary" onClick={generate} disabled={busy || !prompt.trim()}>
              {busy ? "Generating…" : "Generate website"}
            </button>
          </div>

          {busy && (
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-edge overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-violet transition-all duration-1000" style={{ width: `${((step + 1) / 4) * 100}%` }} />
              </div>
              <p className="text-sm text-zinc-400 mt-2">{["Analyzing your description…", "Planning the structure…", "Writing the code…", "Assembling files…"][step]} This can take up to a minute.</p>
            </div>
          )}
          {error && <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => setPrompt(s)} disabled={busy} className="text-xs text-zinc-400 border border-edge rounded-full px-3 py-1.5 hover:text-white hover:border-accent/50 transition">
                {s.length > 60 ? s.slice(0, 60) + "…" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Recent projects */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <input className="kf-input !w-64 !py-2 text-sm" placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {filtered.length === 0 ? (
            <div className="kf-card p-10 text-center text-zinc-500">
              <p className="text-3xl mb-2">🏗️</p>
              <p>No projects yet. Describe your first website above and hit Generate.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <Link key={p.id} href={`/workspace/${p.id}`} className="kf-card p-5 hover:border-accent/50 transition group">
                  <p className="font-medium group-hover:text-accent transition">{p.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{p.framework} · updated {new Date(p.updatedAt).toLocaleDateString()}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Prompt history */}
        {history.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold mb-3">Prompt History</h2>
            <div className="space-y-2">
              {history.slice(0, 5).map((h) => (
                <button key={h.id} onClick={() => setPrompt(h.prompt)} className="block w-full text-left text-sm text-zinc-400 kf-card px-4 py-3 hover:text-white hover:border-accent/40 transition">
                  {h.prompt.length > 120 ? h.prompt.slice(0, 120) + "…" : h.prompt}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Templates */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Template Library</h2>
            <Link href="/templates" className="text-sm text-accent hover:underline">View all →</Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.slice(0, 4).map((t) => (
              <Link key={t.id} href={`/templates?t=${t.id}`} className="kf-card overflow-hidden hover:border-accent/50 transition group">
                <div className={`h-24 bg-gradient-to-br ${t.gradient} flex items-center justify-center text-4xl`}>{t.emoji}</div>
                <div className="p-4">
                  <p className="font-medium group-hover:text-accent transition">{t.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">{t.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}