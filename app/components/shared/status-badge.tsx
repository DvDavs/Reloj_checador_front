"use client";

import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  isActive: boolean;
}

export function StatusBadge({ isActive }: StatusBadgeProps) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={
        isActive
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
      }
    >
      {isActive ? "Activo" : "Inactivo"}
    </Badge>
  );
}