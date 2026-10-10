import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-sans text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0A251C] text-white",
        secondary:
          "bg-[#FAF3EB] text-[#1A1816] border border-[#E8DEC8]",
        gold:
          "bg-[#C5A059] text-[#0A251C]",
        outline:
          "text-[#0A251C] border border-[#0A251C]",
        destructive:
          "bg-rose-600 text-white",
        success:
          "bg-emerald-700 text-white",
        sale:
          "bg-[#512D2B] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
