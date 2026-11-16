import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth";
import { generateWebsite } from "@/lib/ai";

/** Convert plain JS data into a value Prisma accepts for a Json column. */
function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function POST(req: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const { prompt, options } = await req.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 5) {
      return NextResponse.json({ error: "Please describe the website you want (at least a few words)." }, { status: 400 });
    }

    const result = await generateWebsite(prompt, options || {});

    const project = await prisma.project.create({
      data: {
        userId,
        name: options?.name || prompt.slice(0, 60),
        prompt,
        framework: options?.mode || "html",
        files: toJson(result.files),
        history: [],
      },
    });

    await prisma.promptHistory.create({ data: { userId, prompt } });

    return NextResponse.json({ projectId: project.id, summary: result.summary, files: result.files });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Generation failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
