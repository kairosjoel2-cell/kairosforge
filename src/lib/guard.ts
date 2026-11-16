import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";

export async function requireUser() {
  const userId = await getSessionUserId();
  if (!userId) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { user: userId, response: null };
}
