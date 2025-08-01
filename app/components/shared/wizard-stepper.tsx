"use client";

import React from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
    steps: { label: string }[];
    currentStep: number; // 1-based index
    className?: string;
}

export function WizardStepper({ steps, currentStep, className }: WizardStepperProps) {
    return (
        <div className={cn("max-w-4xl mx-auto", className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = currentStep > stepNumber;
                    const isActive = currentStep === stepNumber;
                    
                    return (
                        <React.Fragment key={step.label}>
                            <div className="flex flex-col items-center text-center w-auto px-1">
                                <div
                                    className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1 transition-colors",
                                        {
                                            "bg-blue-600 border-blue-600 text-white": isCompleted,
                                            "border-blue-500 bg-blue-900/50 text-blue-300": isActive,
                                            "border-zinc-600 bg-zinc-800 text-zinc-400": !isCompleted && !isActive,
                                        }
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle size={16} />
                                    ) : (
                                        <span className="font-bold">{stepNumber}</span>
                                    )}
                                </div>
                                <span
                                    className={cn("text-xs leading-tight", {
                                        "text-zinc-200 font-medium": currentStep >= stepNumber,
                                        "text-zinc-500": currentStep < stepNumber,
                                    })}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={cn(
                                        "flex-1 h-0.5 -translate-y-[calc(1rem-theme(space.1)/2-1px)]",
                                        {
                                            "bg-blue-600": isCompleted,
                                            "bg-zinc-700": !isCompleted,
                                        }
                                    )}
                                ></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
} 