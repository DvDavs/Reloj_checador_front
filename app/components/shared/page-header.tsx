"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  actions?: React.ReactNode;
}

export function PageHeader({ title, isLoading, onRefresh, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            className="h-9 w-9"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refrescar</span>
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
}