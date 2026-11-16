"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? router.replace("/dashboard") : router.replace("/login")))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-accent to-violet bg-clip-text text-transparent">
          KAIROSFORGE
        </h1>
        <p className="text-zinc-500 mt-2 text-sm">Describe it. Generate it. Build it.</p>
      </div>
    </main>
  );
}