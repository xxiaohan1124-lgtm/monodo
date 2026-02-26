import React from "react";
import { cn } from "@/src/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-neutral-100", className)}>
      <div
        className="h-full bg-neutral-900 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
