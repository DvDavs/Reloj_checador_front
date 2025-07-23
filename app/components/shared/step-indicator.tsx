"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle } from "lucide-react";

export interface StepInfo {
  number: number;
  title: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

interface StepIndicatorProps {
  steps: StepInfo[];
  className?: string;
}

export function StepIndicator({ steps, className }: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2",
                step.isCompleted || step.isCurrent
                  ? "border-primary text-primary"
                  : "border-gray-300 text-gray-400",
                step.isCurrent && "bg-primary/10"
              )}
            >
              {step.isCompleted ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <span className="font-bold">{step.number}</span>
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-center text-sm",
                step.isCompleted || step.isCurrent
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "mx-4 h-1 flex-1 rounded-full",
                step.isCompleted ? "bg-primary" : "bg-gray-300"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
} 