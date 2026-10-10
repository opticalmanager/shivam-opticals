import React from "react";
import { LucideIcon, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-[#E8DCCF] rounded-xl my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#FAF3EB] text-[#C5A059] flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-[#0A251C] mb-1">{title}</h4>
      <p className="text-xs text-stone-500 max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button
          type="button"
          size="sm"
          onClick={onAction}
          className="bg-[#0A251C] hover:bg-[#153e30] text-[#FAF7F2] text-xs px-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
