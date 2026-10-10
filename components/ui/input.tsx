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
          "flex h-10 w-full bg-[#FCFAF7] border border-[#E8DEC8] px-3 py-2 text-xs font-sans text-[#1A1816] placeholder:text-stone-400 focus-visible:outline-none focus-visible:border-[#0A251C] focus-visible:ring-1 focus-visible:ring-[#0A251C] disabled:cursor-not-allowed disabled:opacity-50 transition-colors rounded-lg",
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
