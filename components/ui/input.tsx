"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
  return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border px-3 py-2 text-sm shadow-sm",
          "border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400",
          "dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-600",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
