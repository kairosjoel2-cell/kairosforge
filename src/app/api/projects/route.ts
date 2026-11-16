import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";

interface FileEntry { path: string; content: string }

export async function GET(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(project);
  }
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, prompt: true, framework: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(projects);
}

export async function PATCH(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id, name, files } = await req.json();
    const project = await prisma.project.findFirst({ where: { id, userId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const updated = await prisma.project.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...(files ? { files } : {}) },
    });
    return NextResponse.json({ id: updated.id, name: updated.name, updatedAt: updated.updatedAt });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.project.deleteMany({ where: { id, userId } });
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // Duplicate project
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  try {
    const { id } = await req.json();
    const src = await prisma.project.findFirst({ where: { id, userId } });
    if (!src) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const copy = await prisma.project.create({
      data: {
        userId,
        name: `${src.name} (copy)`,
        prompt: src.prompt,
        framework: src.framework,
        files: src.files,
        history: src.history,
      },
    });
    return NextResponse.json({ id: copy.id, name: copy.name });
  } catch {
    return NextResponse.json({ error: "Duplicate failed." }, { status: 500 });
  }
}

export interface FileEntryRef extends FileEntry {}
