"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  backHref?: string;
  className?: string;
}

export function BreadcrumbNav({ items, backHref, className = "" }: BreadcrumbNavProps) {
  return (
    <div className={`flex items-center gap-2 mb-6 ${className}`}>
      {backHref && (
        <Link href={backHref} aria-label="Volver">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      )}
      
      <nav className="flex items-center space-x-1 text-sm text-zinc-400">
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
            {item.href ? (
              <Link 
                href={item.href} 
                className="hover:text-zinc-200 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-zinc-200 font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}