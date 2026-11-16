# KAIROSFORGE

**Describe it. Generate it. Build it.**

KAIROSFORGE AI is a premium AI-powered website generation platform. Describe any website in plain English and get real, working, responsive source code — then edit it with natural language, preview it live, and export it.

## Features

- **AI Website Generator** — describe your site; KAIROSFORGE produces a complete multi-file project (HTML/CSS/JS or React) via a real server-side AI integration (OpenAI or Anthropic, switchable).
- **Workspace** — file explorer, Monaco code editor, live preview (desktop / tablet / mobile) in a sandboxed iframe, undo/redo, save.
- **AI Editing** — natural-language instructions modify actual project files while preserving functionality. Change history included.
- **Project Management** — create, save, rename, delete, duplicate, reopen. All data persisted per-user in PostgreSQL via Prisma.
- **ZIP Export** — download a complete project folder with README and install instructions, ready for VS Code.
- **GitHub Export** — connect a GitHub token (stored server-side, never exposed to the browser), create a new repo or push into an existing one.
- **Template Library** — 12 professional templates (Supermarket, Restaurant, Hotel, Portfolio, SaaS, E-commerce, Church, Business, Agency, Blog, Education, Landing page), each customisable with AI.
- **Auth** — register, login, logout, password recovery flow, private per-user data.

## Tech Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · Monaco Editor · JSZip · jose (JWT sessions) · bcryptjs

## Getting Started

1. **Install**
   ```bash
   npm install
   ```
2. **Configure environment** — copy `.env.example` to `.env` and fill in:
   | Variable | Purpose | Where to get it |
   |---|---|---|
   | `DATABASE_URL` | PostgreSQL connection string | [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) (free tiers) |
   | `AUTH_SECRET` | JWT session signing secret | `openssl rand -base64 32` |
   | `AI_PROVIDER` | `openai` or `anthropic` | your choice |
   | `AI_API_KEY` | AI provider API key | [platform.openai.com](https://platform.openai.com/api-keys) or [console.anthropic.com](https://console.anthropic.com) |
   | `AI_MODEL` | Model name (e.g. `gpt-4o`) | provider docs |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional OAuth export | [github.com/settings/developers](https://github.com/settings/developers) |
3. **Create the database schema**
   ```bash
   npm run db:push
   ```
4. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000, create an account, and describe your first website.

## Deployment (Vercel)

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Import the repo into [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Deploy. The build runs `prisma generate && next build` automatically.

## Security Notes

- AI keys and GitHub tokens are used exclusively server-side. They are never sent to the browser.
- Generated websites run in a **sandboxed iframe** (`sandbox="allow-scripts"`, no same-origin) so untrusted generated code cannot touch the app.
- Passwords are hashed with bcrypt (cost 12). Sessions use signed, httpOnly JWT cookies.
- Every API route verifies the session and scopes all data queries to the authenticated user.

## Known Limitations (honest list)

- Password recovery uses a stub flow — real email delivery requires adding an SMTP provider.
- React-mode projects export as component sources; a Vite scaffold wrapper is recommended before running standalone (see README generated inside the ZIP).
- GitHub OAuth app flow is optional; token-based connection is the default path.
