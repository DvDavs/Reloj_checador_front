// Performance monitoring utilities for TimeClock components
// Helps track render performance and optimization effectiveness

import React from 'react';

interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  renderTimes: number[];
}

class PerformanceMonitor {
  private metrics: Map<string, RenderMetrics> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start measuring render time for a component
   */
  startRender(componentName: string): () => void {
    if (!this.isEnabled) return () => {};

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.recordRender(componentName, renderTime);
    };
  }

  /**
   * Record a render completion
   */
  private recordRender(componentName: string, renderTime: number): void {
    const existing = this.metrics.get(componentName);

    if (existing) {
      existing.renderCount++;
      existing.lastRenderTime = renderTime;
      existing.renderTimes.push(renderTime);

      // Keep only last 100 render times for average calculation
      if (existing.renderTimes.length > 100) {
        existing.renderTimes.shift();
      }

      existing.averageRenderTime =
        existing.renderTimes.reduce((sum, time) => sum + time, 0) /
        existing.renderTimes.length;
    } else {
      this.metrics.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: renderTime,
        averageRenderTime: renderTime,
        renderTimes: [renderTime],
      });
    }
  }

  /**
   * Get performance metrics for a component
   */
  getMetrics(componentName: string): RenderMetrics | null {
    return this.metrics.get(componentName) || null;
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): RenderMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    if (!this.isEnabled) return;

    console.group('🚀 TimeClock Performance Summary');

    const allMetrics = this.getAllMetrics().sort(
      (a, b) => b.renderCount - a.renderCount
    );

    if (allMetrics.length === 0) {
      console.log('No performance data collected yet');
      console.groupEnd();
      return;
    }

    console.table(
      allMetrics.map((metric) => ({
        Component: metric.componentName,
        'Render Count': metric.renderCount,
        'Last Render (ms)': metric.lastRenderTime.toFixed(2),
        'Avg Render (ms)': metric.averageRenderTime.toFixed(2),
        Performance:
          metric.averageRenderTime < 16
            ? '✅ Good'
            : metric.averageRenderTime < 32
              ? '⚠️ Fair'
              : '❌ Poor',
      }))
    );

    // Identify components that might need optimization
    const slowComponents = allMetrics.filter((m) => m.averageRenderTime > 16);
    if (slowComponents.length > 0) {
      console.warn(
        'Components that may need optimization:',
        slowComponents.map((c) => c.componentName).join(', ')
      );
    }

    console.groupEnd();
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Check if monitoring is enabled
   */
  get enabled(): boolean {
    return this.isEnabled;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for monitoring component render performance
 */
export function useRenderPerformance(componentName: string) {
  if (!performanceMonitor.enabled) {
    return { startRender: () => () => {} };
  }

  return {
    startRender: () => performanceMonitor.startRender(componentName),
  };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName =
    componentName || Component.displayName || Component.name || 'Unknown';

  const WrappedComponent = (props: P) => {
    const { startRender } = useRenderPerformance(displayName);

    React.useLayoutEffect(() => {
      const endRender = startRender();
      return endRender;
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;

  return WrappedComponent;
}

// Development-only performance logging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log performance summary every 30 seconds
  setInterval(() => {
    performanceMonitor.logSummary();
  }, 30000);

  // Expose performance monitor to window for debugging
  (window as any).__timeClockPerformance = performanceMonitor;
}

export type { RenderMetrics };
