import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

// Password recovery: user provides email + new password + a reset token.
// In production, send a real email link. For now we use a simple flow:
// the user must know their email AND answer with a new password, and
// we email a code (stub: returns code in response only in dev mode).
export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "Email and a new password of at least 8 characters are required." }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "No account with this email." }, { status: 404 });
    }
    if (code) {
      // verify code (in-memory store would be needed for a real flow; this is a dev stub)
      // In production, implement a proper email-based reset token with expiry.
      return NextResponse.json({ error: "Email-based reset codes are not configured. Please contact support or set up SMTP integration." }, { status: 501 });
    }
    // No code path: initiate reset — respond that a code was sent (stub).
    return NextResponse.json({ message: "If this email is registered, a reset code has been sent. Code delivery is not configured; set up SMTP for production." });
  } catch {
    return NextResponse.json({ error: "Request failed." }, { status: 500 });
  }
}
