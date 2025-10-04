"use client";

import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function UserButton() {
  const { user, isLoading } = useUser();
  const [handle, setHandle] = useState<string | null>(null);
  const [loadingHandle, setLoadingHandle] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) {
        setHandle(null);
        return;
      }
      try {
        setLoadingHandle(true);
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!active) return;
        setHandle(data?.user?.handle || null);
      } catch {
        if (active) setHandle(null);
      } finally {
        if (active) setLoadingHandle(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user]);

  if (isLoading) return <div className="h-9 w-24 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />;
  if (!user) return (
    <Button asChild variant="outline">
      <Link href="/api/auth/login">Sign in</Link>
    </Button>
  );
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">
        {loadingHandle ? "Loading…" : handle || "Anonymous"}
      </span>
      <Button asChild variant="outline">
        <Link href="/api/auth/logout">Sign out</Link>
      </Button>
    </div>
  );
}
