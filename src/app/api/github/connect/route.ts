import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

// Simple token-connection flow: user pastes a GitHub personal access token
// (with repo scope). Stored server-side only. For production, prefer a full
// OAuth App flow (GITHUB_CLIENT_ID/SECRET + /api/github/callback).

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { token } = await req.json();
    if (!token || typeof token !== "string" || token.length < 20) {
      return NextResponse.json({ error: "A valid GitHub token is required." }, { status: 400 });
    }
    // Validate token against GitHub
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "GitHub rejected this token." }, { status: 400 });
    }
    await prisma.user.update({ where: { id: userId }, data: { githubToken: token } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Connection failed." }, { status: 500 });
  }
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  await prisma.user.update({ where: { id: userId }, data: { githubToken: null } });
  return NextResponse.json({ ok: true });
}
