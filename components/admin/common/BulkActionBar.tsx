import React from "react";
import { Download, Edit3, Trash2, X, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport?: () => void;
  onEditInfo?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: string) => void;
  className?: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onExport,
  onEditInfo,
  onDelete,
  onStatusChange,
  className,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200",
        className
      )}
    >
      <div className="bg-[#0A251C] text-[#FAF7F2] px-4 py-2.5 rounded-full shadow-2xl border border-stone-700 flex items-center gap-3 sm:gap-4 text-xs font-medium">
        <div className="flex items-center gap-2 pl-1 font-semibold text-stone-200 border-r border-stone-700 pr-3">
          <span className="w-5 h-5 rounded-full bg-[#C5A059] text-white flex items-center justify-center text-[10px] font-bold">
            {selectedCount}
          </span>
          <span>Selected</span>
        </div>

        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded hover:bg-stone-800"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>Export</span>
          </button>
        )}

        {onEditInfo && (
          <button
            type="button"
            onClick={onEditInfo}
            className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1 px-2 rounded hover:bg-stone-800"
          >
            <Edit3 className="w-3.5 h-3.5 text-stone-400" />
            <span>Edit Info</span>
          </button>
        )}

        {onStatusChange && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onStatusChange("published")}
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-stone-800"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Publish</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusChange("draft")}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-stone-800"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Draft</span>
            </button>
          </div>
        )}

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer py-1 px-2 rounded hover:bg-rose-950/40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        )}

        <button
          type="button"
          onClick={onClearSelection}
          aria-label="Clear selection"
          className="ml-1 text-stone-400 hover:text-white p-1 rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
