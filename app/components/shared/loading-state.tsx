"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ 
  message = "Cargando...", 
  className = "flex justify-center items-center p-8" 
}: LoadingStateProps) {
  return (
    <div className={className}>
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <p className="ml-4 text-lg">{message}</p>
    </div>
  );
}