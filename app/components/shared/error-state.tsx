"use client";

import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  message: string;
  className?: string;
}

export function ErrorState({ 
  message, 
  className = "flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-md" 
}: ErrorStateProps) {
  return (
    <div className={className}>
      <AlertCircle className="h-6 w-6" />
      <p>{message}</p>
    </div>
  );
}