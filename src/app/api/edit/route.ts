import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { editWebsite } from "@/lib/ai";

interface FileEntry { path: string; content: string }

/** Convert plain JS data into a value Prisma accepts for a Json column. */
// KAIROSFORGE Prisma build fix
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { projectId, instruction } = await req.json();
    if (!projectId || !instruction) {
      return NextResponse.json({ error: "projectId and instruction are required." }, { status: 400 });
    }
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const files = project.files as unknown as FileEntry[];
    const result = await editWebsite(files, instruction);

    const merged: FileEntry[] = [...files];
    for (const nf of result.files) {
      const idx = merged.findIndex((f) => f.path === nf.path);
      if (idx >= 0) merged[idx] = nf;
      else merged.push(nf);
    }

    const history: unknown[] = Array.isArray(project.history) ? (project.history as unknown[]) : [];
    const entry = { instruction, summary: result.summary, at: new Date().toISOString() };
    const newHistory = [...history, entry];

    await prisma.project.update({
      where: { id: project.id },
      data: {
        files: toJson(merged),
        history: toJson(newHistory),
      },
    });

    return NextResponse.json({ summary: result.summary, files: merged });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Edit failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
