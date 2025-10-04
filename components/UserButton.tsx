"use client";

import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@/components/ui/button";

export function UserButton() {
  const { user, isLoading } = useUser();
  if (isLoading) return <div className="h-9 w-24 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />;
  if (!user) return (
    <Button asChild variant="outline">
      <Link href="/api/auth/login">Sign in</Link>
    </Button>
  );
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-600 dark:text-neutral-300">{user.nickname || user.name || "You"}</span>
      <Button asChild variant="outline">
        <Link href="/api/auth/logout">Sign out</Link>
      </Button>
    </div>
  );
}

