"use client";

import { useEffect, useMemo, useState } from "react";
import { onToast, type ToastOptions } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type ToastItem = Required<Pick<ToastOptions, "id">> & ToastOptions & { createdAt: number };

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onToast((opts) => {
      const id = opts.id || Math.random().toString(36).slice(2);
      const item: ToastItem = { id, createdAt: Date.now(), ...opts } as ToastItem;
      setToasts((t) => [item, ...t].slice(0, 5));
      const dur = opts.durationMs ?? 3500;
      const timeout = setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, dur);
      return () => clearTimeout(timeout);
    });
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}

function Toast({ title, description, variant }: ToastItem) {
  const isDestructive = variant === "destructive";
  return (
    <div
      className={cn(
        "rounded-md border p-3 shadow-md bg-white text-neutral-900",
        "dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
        isDestructive
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950"
          : "border-neutral-200"
      )}
      data-state="open"
    >
      {title && (
        <div
          className={cn(
            "text-sm font-medium",
            isDestructive && "text-red-900 dark:text-red-200"
          )}
        >
          {title}
        </div>
      )}
      {description && (
        <div className={cn("text-sm mt-1", isDestructive && "text-red-800 dark:text-red-300")}>{description}</div>
      )}
    </div>
  );
}
