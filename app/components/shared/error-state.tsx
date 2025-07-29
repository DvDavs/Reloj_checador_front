"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  className?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  message, 
  className = "flex flex-col items-center justify-center gap-4 text-destructive p-8 rounded-lg border border-destructive/20 bg-destructive/5",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6" />
        <p className="font-semibold text-lg">{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="destructive" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}