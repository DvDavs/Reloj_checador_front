/**
 * Performance testing utilities for TimeClock component refactoring validation
 */

export interface PerformanceMetrics {
  renderCount: number;
  renderTimes: number[];
  averageRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  memoryUsage?: number;
  componentName: string;
  timestamp: number;
}

export interface ComponentRenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  props: any;
}

// Global performance tracking
const performanceData = new Map<string, PerformanceMetrics>();
const renderCounts = new Map<string, number>();
const renderTimes = new Map<string, number[]>();

/**
 * Performance profiler hook for React components
 */
export function usePerformanceProfiler(componentName: string, props?: any) {
  const renderStartTime = performance.now();

  // Track render count
  const currentCount = renderCounts.get(componentName) || 0;
  renderCounts.set(componentName, currentCount + 1);

  // Track render time
  React.useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime;

    const times = renderTimes.get(componentName) || [];
    times.push(renderDuration);
    renderTimes.set(componentName, times);

    // Update performance metrics
    const metrics: PerformanceMetrics = {
      renderCount: currentCount + 1,
      renderTimes: times,
      averageRenderTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxRenderTime: Math.max(...times),
      minRenderTime: Math.min(...times),
      componentName,
      timestamp: Date.now(),
    };

    // Add memory usage if available
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    performanceData.set(componentName, metrics);

    // Log excessive render times
    if (renderDuration > 16) {
      // More than one frame at 60fps
      console.warn(
        `🐌 Slow render detected in ${componentName}: ${renderDuration.toFixed(2)}ms`
      );
    }

    // Log excessive render counts
    if (currentCount > 0 && currentCount % 10 === 0) {
      console.info(
        `📊 ${componentName} has rendered ${currentCount + 1} times`
      );
    }
  });

  return {
    renderCount: currentCount + 1,
    renderStartTime,
  };
}

/**
 * Get performance metrics for a specific component
 */
export function getComponentMetrics(
  componentName: string
): PerformanceMetrics | undefined {
  return performanceData.get(componentName);
}

/**
 * Get all performance metrics
 */
export function getAllMetrics(): Map<string, PerformanceMetrics> {
  return new Map(performanceData);
}

/**
 * Reset performance tracking for a component or all components
 */
export function resetMetrics(componentName?: string) {
  if (componentName) {
    performanceData.delete(componentName);
    renderCounts.delete(componentName);
    renderTimes.delete(componentName);
  } else {
    performanceData.clear();
    renderCounts.clear();
    renderTimes.clear();
  }
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(): string {
  const metrics = Array.from(performanceData.values());

  if (metrics.length === 0) {
    return 'No performance data available';
  }

  let report = '📊 Performance Report\n';
  report += '='.repeat(50) + '\n\n';

  metrics.forEach((metric) => {
    report += `Component: ${metric.componentName}\n`;
    report += `  Render Count: ${metric.renderCount}\n`;
    report += `  Average Render Time: ${metric.averageRenderTime.toFixed(2)}ms\n`;
    report += `  Min Render Time: ${metric.minRenderTime.toFixed(2)}ms\n`;
    report += `  Max Render Time: ${metric.maxRenderTime.toFixed(2)}ms\n`;
    if (metric.memoryUsage) {
      report += `  Memory Usage: ${(metric.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`;
    }
    report += '\n';
  });

  return report;
}

/**
 * Compare performance between two sets of metrics
 */
export function comparePerformance(
  beforeMetrics: Map<string, PerformanceMetrics>,
  afterMetrics: Map<string, PerformanceMetrics>
): string {
  let report = '🔄 Performance Comparison\n';
  report += '='.repeat(50) + '\n\n';

  const allComponents = new Set([
    ...beforeMetrics.keys(),
    ...afterMetrics.keys(),
  ]);

  allComponents.forEach((componentName) => {
    const before = beforeMetrics.get(componentName);
    const after = afterMetrics.get(componentName);

    report += `Component: ${componentName}\n`;

    if (before && after) {
      const renderTimeDiff = after.averageRenderTime - before.averageRenderTime;
      const renderCountDiff = after.renderCount - before.renderCount;

      report += `  Render Time: ${before.averageRenderTime.toFixed(2)}ms → ${after.averageRenderTime.toFixed(2)}ms `;
      report += `(${renderTimeDiff > 0 ? '+' : ''}${renderTimeDiff.toFixed(2)}ms)\n`;

      report += `  Render Count: ${before.renderCount} → ${after.renderCount} `;
      report += `(${renderCountDiff > 0 ? '+' : ''}${renderCountDiff})\n`;

      if (renderTimeDiff < -1) {
        report += `  ✅ Performance improved by ${Math.abs(renderTimeDiff).toFixed(2)}ms\n`;
      } else if (renderTimeDiff > 1) {
        report += `  ⚠️ Performance degraded by ${renderTimeDiff.toFixed(2)}ms\n`;
      } else {
        report += `  ➡️ Performance unchanged\n`;
      }
    } else if (before && !after) {
      report += `  ❌ Component removed in new version\n`;
    } else if (!before && after) {
      report += `  ✨ New component added\n`;
      report += `  Render Time: ${after.averageRenderTime.toFixed(2)}ms\n`;
      report += `  Render Count: ${after.renderCount}\n`;
    }

    report += '\n';
  });

  return report;
}

/**
 * Memory usage tracker
 */
export function trackMemoryUsage(): number | null {
  if ('memory' in performance) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return null;
}

/**
 * Measure component render performance
 */
export function measureRenderPerformance<T extends React.ComponentType<any>>(
  Component: T,
  displayName?: string
): T {
  const WrappedComponent = React.forwardRef<any, React.ComponentProps<T>>(
    (props, ref) => {
      const componentName =
        displayName || Component.displayName || Component.name || 'Unknown';
      usePerformanceProfiler(componentName, props);

      return React.createElement(Component, { ...props, ref });
    }
  );

  WrappedComponent.displayName = `PerformanceProfiled(${displayName || Component.displayName || Component.name})`;

  return WrappedComponent as unknown as T;
}

// React import (will be available in the component context)
declare const React: typeof import('react');
