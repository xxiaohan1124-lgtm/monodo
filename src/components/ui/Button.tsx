import React from "react";
import { cn } from "@/src/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm": variant === "primary",
            "bg-neutral-100 text-neutral-900 hover:bg-neutral-200": variant === "secondary",
            "border border-neutral-200 bg-transparent hover:bg-neutral-50 text-neutral-900": variant === "outline",
            "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900": variant === "ghost",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
