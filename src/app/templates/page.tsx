"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TEMPLATES } from "@/lib/templates";

function TemplatesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const t = sp.get("t");
    if (t) {
      const tpl = TEMPLATES.find((x) => x.id === t);
      if (tpl) setPrompt(tpl.prompt);
    }
  }, [sp]);

  async function useTemplate() {
    if (!prompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, options: { mode: "html", theme: "dark" } }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed.");
      router.push(`/workspace/${d.projectId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <nav className="border-b border-edge bg-panel/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">KAIROSFORGE</Link>
          <Link href="/dashboard" className="kf-btn-ghost text-sm">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Template Library</h1>
        <p className="text-zinc-400 mt-1 text-sm">Start from a proven structure, then customise with AI.</p>

        <div className="mt-6 kf-card p-4">
          <textarea className="kf-input min-h-20" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Customise the template with AI — describe your changes or a full new brief…" />
          <div className="flex justify-between items-center mt-3">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button className="kf-btn-primary text-sm" onClick={useTemplate} disabled={busy || !prompt.trim()}>
              {busy ? "Generating…" : "Use this template → Generate"}
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="kf-card overflow-hidden hover:border-accent/50 transition">
              <div className={`h-32 bg-gradient-to-br ${t.gradient} flex items-center justify-center text-5xl`}>{t.emoji}</div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wide">{t.category}</p>
                <p className="font-semibold mt-1">{t.name}</p>
                <p className="text-sm text-zinc-400 mt-1">{t.description}</p>
                <div className="flex gap-2 mt-4">
                  <button className="kf-btn-ghost text-xs flex-1" onClick={() => setPreview(t.id)}>Preview</button>
                  <button className="kf-btn-primary text-xs flex-1" onClick={() => { setPrompt(t.prompt); document.querySelector("textarea")?.focus(); }}>Use Template</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {preview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setPreview(null)}>
          <div className="kf-card p-6 max-w-lg w-full kf-fade-up" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const t = TEMPLATES.find((x) => x.id === preview)!;
              return (
                <>
                  <div className={`h-48 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center text-6xl mb-4`}>{t.emoji}</div>
                  <h3 className="text-xl font-bold">{t.name}</h3>
                  <p className="text-zinc-400 text-sm mt-2">{t.description}</p>
                  <p className="text-xs text-zinc-500 mt-3 bg-base p-3 rounded-lg">{t.prompt}</p>
                  <div className="flex gap-2 mt-4">
                    <button className="kf-btn-ghost flex-1 text-sm" onClick={() => setPreview(null)}>Close</button>
                    <button className="kf-btn-primary flex-1 text-sm" onClick={() => { setPrompt(t.prompt); setPreview(null); }}>Use Template</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </main>
  );
}

export default function TemplatesPage() {
  return <TemplatesInner />;
}