import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// Secure GitHub export: uses the server-stored, encrypted token.
// The user connects GitHub via a separate OAuth setup screen (see /settings/github).
// This route never exposes the token to the client.

interface FileEntry { path: string; content: string }

function b64(content: string): string {
  return Buffer.from(content, "utf8").toString("base64");
}

async function gh(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return res;
}

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { githubToken: true } });
  if (!user?.githubToken) {
    return NextResponse.json({ connected: false, setup: "Set GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET and complete OAuth at /api/github/callback, or paste a personal access token in Settings → GitHub." }, { status: 200 });
  }
  const res = await gh("/user", user.githubToken);
  if (!res.ok) {
    return NextResponse.json({ connected: false, error: "GitHub token is invalid or expired. Reconnect in Settings → GitHub." });
  }
  const u = await res.json();
  const repos = await gh("/user/repos?per_page=50&sort=updated", user.githubToken);
  const repoList = repos.ok ? await repos.json() : [];
  return NextResponse.json({
    connected: true,
    login: u.login,
    repos: repoList.map((r: { name: string; full_name: string; private: boolean }) => ({ name: r.name, full_name: r.full_name, private: r.private })),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { projectId, repoName, createNew, newRepoName } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { githubToken: true } });
    if (!user?.githubToken) {
      return NextResponse.json({ error: "GitHub not connected. Connect your account in Settings → GitHub." }, { status: 400 });
    }
    const token = user.githubToken;

    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    let repo = repoName;
    if (createNew) {
      if (!newRepoName) return NextResponse.json({ error: "newRepoName required." }, { status: 400 });
      const cr = await gh("/user/repos", token, {
        method: "POST",
        body: JSON.stringify({ name: newRepoName, private: false, auto_init: true }),
      });
      if (!cr.ok) {
        const errText = await cr.text();
        return NextResponse.json({ error: `Failed to create repo: ${errText.slice(0, 200)}` }, { status: cr.status });
      }
      repo = newRepoName;
    }

    const files = project.files as unknown as FileEntry[];
    const results: { path: string; ok: boolean }[] = [];

    for (const f of files) {
      const enc = b64(f.content);
      let sha: string | undefined;
      const existing = await gh(`/repos/${(await gh("/user", token)).json().then((u: { login: string }) => u.login)}/${repo}/contents/${f.path}`, token);
      if (existing.ok) {
        const j = await existing.json();
        sha = j.sha;
      }
      const pr = await gh(
        `/repos/${(await gh("/user", token)).json().then((u: { login: string }) => u.login)}/${repo}/contents/${f.path}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify({ message: `KAIROSFORGE: add ${f.path}`, content: enc, ...(sha ? { sha } : {}) }),
        }
      );
      results.push({ path: f.path, ok: pr.ok });
    }

    const failed = results.filter((r) => !r.ok);
    if (failed.length > 0) {
      return NextResponse.json({ error: `Some files failed to upload: ${failed.map((f) => f.path).join(", ")}`, pushed: results.length - failed.length, total: results.length }, { status: 500 });
    }

    return NextResponse.json({ ok: true, repo, pushed: results.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Export failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
