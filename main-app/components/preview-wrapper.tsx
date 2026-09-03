import React from "react";
import { cn } from "@/lib/utils";

export function PreviewWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/50 bg-background shadow-sm overflow-hidden pointer-events-none select-none",
        className
      )}
      aria-hidden="true"
    >
      {/* MacOS style window dots just for a subtle presentation feel */}
      <div className="h-8 border-b border-border/50 bg-muted/30 flex items-center px-4 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
        <div className="w-2.5 h-2.5 rounded-full bg-border" />
      </div>
      <div className="p-0">
        {children}
      </div>
    </div>
  );
}
