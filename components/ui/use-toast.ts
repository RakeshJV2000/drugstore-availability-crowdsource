"use client";

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  durationMs?: number;
};

const EVENT_NAME = "app:toast";

export function toast(options: ToastOptions) {
  if (typeof window === "undefined") return;
  const detail = { ...options, id: options.id || Math.random().toString(36).slice(2) };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
}

export function onToast(listener: (opts: ToastOptions) => void) {
  const handler = (e: Event) => listener((e as CustomEvent).detail as ToastOptions);
  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}

