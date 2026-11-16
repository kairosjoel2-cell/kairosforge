"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface FileEntry { path: string; content: string }
interface HistoryEntry { instruction: string; summary: string; at: string }

type Viewport = "desktop" | "tablet" | "mobile";

const VIEWPORT_WIDTH: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

export default function Workspace() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [name, setName] = useState("");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activePath, setActivePath] = useState<string>("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [editInstruction, setEditInstruction] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [undoStack, setUndoStack] = useState<FileEntry[][]>([]);
  const [redoStack, setRedoStack] = useState<FileEntry[][]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ connected: boolean; login?: string; repos?: { name: string; full_name: string }[]; error?: string; setup?: string } | null>(null);
  const [repoChoice, setRepoChoice] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [exportMsg, setExportMsg] = useState("");

  const notify = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch(`/api/projects?id=${projectId}`).then(async (r) => {
      if (!r.ok) return router.replace("/dashboard");
      const p = await r.json();
      setName(p.name);
      setFiles(p.files || []);
      setHistory(p.history || []);
      if (p.files?.length) setActivePath(p.files[0].path);
    });
  }, [projectId, router]);

  useEffect(() => {
    if (exportOpen) fetch("/api/github/export").then((r) => r.json()).then(setGithubStatus);
  }, [exportOpen]);

  const previewDoc = useMemo(() => {
    const html = files.find((f) => f.path.endsWith(".html"));
    if (!html) return "<html><body style='font-family:sans-serif;padding:2rem;color:#888'>No HTML entry file found.</body></html>";
    let doc = html.content;
    const css = files.filter((f) => f.path.endsWith(".css")).map((f) => `<style>${f.content}</style>`).join("\n");
    const js = files.filter((f) => f.path.endsWith(".js")).map((f) => `<script>${f.content}</script>`).join("\n");
    doc = doc.replace(/<link[^>]*stylesheet[^>]*>/gi, "");
    doc = doc.replace(/<script[^>]*src=[^>]*><\/script>/gi, "");
    doc = doc.includes("</head>") ? doc.replace("</head>", `${css}</head>`) : css + doc;
    doc = doc.includes("</body>") ? doc.replace("</body>", `${js}</body>`) : doc + js;
    return doc;
  }, [files]);

  const activeFile = files.find((f) => f.path === activePath);

  function pushUndo() {
    setUndoStack((s) => [...s.slice(-19), files.map((f) => ({ ...f }))]);
    setRedoStack([]);
  }

  function undo() {
    if (undoStack.length === 0) return;
    setRedoStack((r) => [...r, files.map((f) => ({ ...f }))]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setFiles(prev);
    setPreviewKey((k) => k + 1);
  }

  function redo() {
    if (redoStack.length === 0) return;
    setUndoStack((s) => [...s, files.map((f) => ({ ...f }))]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setFiles(next);
    setPreviewKey((k) => k + 1);
  }

  function updateActive(content: string) {
    setFiles((fs) => fs.map((f) => (f.path === activePath ? { ...f, content } : f)));
  }

  async function save() {
    setSaving(true);
    try {
      const r = await fetch("/api/projects", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: projectId, name, files }) });
      if (!r.ok) throw new Error("Save failed.");
      notify("ok", "Project saved.");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function applyEdit() {
    if (!editInstruction.trim()) return;
    setEditBusy(true);
    pushUndo();
    try {
      const r = await fetch("/api/edit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, instruction: editInstruction }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Edit failed.");
      setFiles(d.files);
      setHistory((h) => [...h, { instruction: editInstruction, summary: d.summary, at: new Date().toISOString() }]);
      setEditInstruction("");
      setPreviewKey((k) => k + 1);
      notify("ok", d.summary || "Changes applied.");
    } catch (e) {
      notify("err", e instanceof Error ? e.message : "Edit failed.");
    } finally {
      setEditBusy(false);
    }
  }

  async function exportToGithub() {
    setExportMsg("Exporting…");
    try {
      const r = await fetch("/api/github/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, repoName: repoChoice || undefined, createNew: !!newRepoName, newRepoName }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Export failed.");
      setExportMsg(`✅ Pushed ${d.pushed} files to ${d.repo}.`);
    } catch (e) {
      setExportMsg("❌ " + (e instanceof Error ? e.message : "Export failed."));
    }
  }

  const groups = useMemo(() => {
    const g: Record<string, FileEntry[]> = { "HTML": [], "CSS": [], "JavaScript": [], "React": [], "Other": [] };
    for (const f of files) {
      if (f.path.endsWith(".html")) g["HTML"].push(f);
      else if (f.path.endsWith(".css")) g["CSS"].push(f);
      else if (f.path.endsWith(".js") || f.path.endsWith(".jsx") || f.path.endsWith(".ts")) {
        if (f.path.includes(".jsx") || f.path.includes("component") || f.path.includes("App")) g["React"].push(f);
        else g["JavaScript"].push(f);
      } else g["Other"].push(f);
    }
    return g;
  }, [files]);

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-edge bg-panel flex items-center gap-2 px-3 h-14 flex-shrink-0">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white px-2" title="Back to dashboard">←</Link>
        <input className="bg-transparent border border-edge rounded-lg px-3 py-1.5 text-sm w-44 sm:w-60 focus:outline-none focus:border-accent/60" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex-1" />
        <button onClick={undo} disabled={undoStack.length === 0} className="kf-btn-ghost text-xs px-3 py-1.5 disabled:opacity-40" title="Undo">Undo</button>
        <button onClick={redo} disabled={redoStack.length === 0} className="kf-btn-ghost text-xs px-3 py-1.5 disabled:opacity-40" title="Redo">Redo</button>
        <button onClick={save} disabled={saving} className="kf-btn-ghost text-xs px-3 py-1.5" title="Save project">{saving ? "Saving…" : "Save"}</button>
        <button onClick={() => setExportOpen(true)} className="kf-btn-ghost text-xs px-3 py-1.5" title="Export">Export</button>
      </div>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        {/* File explorer */}
        <aside className="w-full lg:w-60 border-b lg:border-b-0 lg:border-r border-edge bg-panel/60 p-3 overflow-y-auto kf-scroll max-h-48 lg:max-h-none">
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2 px-1">Files</p>
          {Object.entries(groups).map(([g, fs]) =>
            fs.length === 0 ? null : (
              <div key={g} className="mb-3">
                <p className="text-xs text-zinc-500 mb-1 px-1">{g}</p>
                {fs.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setActivePath(f.path)}
                    className={`block w-full text-left text-sm px-2 py-1.5 rounded-lg transition ${activePath === f.path ? "bg-accent/20 text-white" : "text-zinc-400 hover:text-white hover:bg-edge/50"}`}
                  >
                    {f.path}
                  </button>
                ))}
              </div>
            )
          )}
        </aside>

        {/* Preview */}
        <section className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-edge min-h-[320px] lg:min-h-0">
          <div className="flex items-center gap-2 px-3 h-11 border-b border-edge bg-panel/60 flex-shrink-0">
            {(["desktop", "tablet", "mobile"] as Viewport[]).map((v) => (
              <button key={v} onClick={() => setViewport(v)} className={`text-xs px-3 py-1.5 rounded-lg capitalize transition ${viewport === v ? "bg-accent/20 text-white" : "text-zinc-400 hover:text-white"}`}>
                {v}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => setPreviewKey((k) => k + 1)} className="text-xs px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white" title="Refresh preview">⟳ Refresh</button>
          </div>
          <div className="flex-1 overflow-auto bg-[#0d0d13] p-2 sm:p-4 flex justify-center">
            <iframe
              key={previewKey}
              title="Website preview"
              sandbox="allow-scripts"
              srcDoc={previewDoc}
              className="bg-white rounded-lg shadow-2xl transition-all"
              style={{ width: VIEWPORT_WIDTH[viewport], maxWidth: "100%", height: "100%", minHeight: 480 }}
            />
          </div>
        </section>

        {/* Editor + AI edit */}
        <aside className="w-full lg:w-[42%] flex flex-col overflow-hidden">
          <div className="flex-1 min-h-[240px]">
            {activeFile ? (
              <MonacoEditor
                height="100%"
                theme="vs-dark"
                language={activeFile.path.endsWith(".html") ? "html" : activeFile.path.endsWith(".css") ? "css" : activeFile.path.endsWith(".json") ? "json" : "javascript"}
                value={activeFile.content}
                onChange={(v) => updateActive(v || "")}
                options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true, scrollBeyondLastLine: false }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-500 text-sm">Select a file to edit.</div>
            )}
          </div>
          <div className="border-t border-edge bg-panel p-3 flex-shrink-0">
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">AI Editor</p>
            <div className="flex gap-2">
              <input
                className="kf-input !py-2 text-sm"
                placeholder='e.g. "Make the navigation sticky and add a testimonials section"'
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !editBusy && applyEdit()}
                disabled={editBusy}
              />
              <button className="kf-btn-primary text-sm !px-4" onClick={applyEdit} disabled={editBusy || !editInstruction.trim()}>
                {editBusy ? "Applying…" : "Apply"}
              </button>
            </div>
            {history.length > 0 && (
              <details className="mt-2 text-xs text-zinc-500">
                <summary className="cursor-pointer hover:text-zinc-300">Change history ({history.length})</summary>
                <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto kf-scroll">
                  {history.slice().reverse().map((h, i) => (
                    <li key={i} className="truncate" title={h.summary}>• {h.instruction}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </aside>
      </div>

      {/* Export modal */}
      {exportOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setExportOpen(false)}>
          <div className="kf-card p-6 w-full max-w-md kf-fade-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Export Project</h3>
            <a href={`/api/export/zip?projectId=${projectId}`} className="kf-btn-primary w-full block text-center mb-3">⬇ Download as ZIP</a>
            <div className="border-t border-edge my-4" />
            <p className="text-sm text-zinc-400 mb-3">Export to GitHub</p>
            {githubStatus === null ? (
              <p className="text-sm text-zinc-500">Checking connection…</p>
            ) : !githubStatus.connected ? (
              <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p>GitHub is not connected.</p>
                <p className="text-xs text-zinc-400 mt-1">{githubStatus.error || githubStatus.setup}</p>
                <Link href="/settings" className="text-accent text-xs underline mt-2 inline-block">Go to Settings → GitHub</Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">Connected as <span className="text-white">{githubStatus.login}</span></p>
                <select className="kf-input !py-2 text-sm" value={repoChoice} onChange={(e) => setRepoChoice(e.target.value)}>
                  <option value="">— Choose existing repo —</option>
                  {githubStatus.repos?.map((r) => <option key={r.full_name} value={r.name}>{r.full_name}</option>)}
                </select>
                <input className="kf-input !py-2 text-sm" placeholder="…or new repository name" value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} />
                <button className="kf-btn-primary w-full text-sm" onClick={exportToGithub} disabled={!repoChoice && !newRepoName}>
                  Push to GitHub
                </button>
              </div>
            )}
            {exportMsg && <p className="text-sm mt-3 text-zinc-300">{exportMsg}</p>}
            <button className="kf-btn-ghost w-full mt-4 text-sm" onClick={() => setExportOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm shadow-lg border ${toast.kind === "ok" ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" : "bg-red-500/15 border-red-500/40 text-red-300"} kf-fade-up`}>
          {toast.msg}
        </div>
      )}
    </main>
  );
}