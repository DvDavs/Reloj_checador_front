'use client';

import React, { Profiler } from 'react';

interface ProfilerData {
  id: string;
  phase: 'mount' | 'update';
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

interface ProfilerStats {
  totalRenders: number;
  totalActualDuration: number;
  totalBaseDuration: number;
  averageActualDuration: number;
  averageBaseDuration: number;
  mountDuration: number;
  updateDurations: number[];
  slowRenders: ProfilerData[];
}

// Global profiler data storage
const profilerStats = new Map<string, ProfilerStats>();

/**
 * React Profiler wrapper for performance monitoring
 */
export function ReactProfiler({
  id,
  children,
  enabled = true,
  slowRenderThreshold = 16, // 16ms = 1 frame at 60fps
}: {
  id: string;
  children: React.ReactNode;
  enabled?: boolean;
  slowRenderThreshold?: number;
}) {
  const onRender = React.useCallback(
    (...args: any[]) => {
      const [
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactionsArg,
      ] = args as [
        string,
        'mount' | 'update' | 'nested-update' | string,
        number,
        number,
        number,
        number,
        Set<any> | undefined,
      ];

      const interactions = interactionsArg ?? new Set<any>();
      if (!enabled) return;

      const data: ProfilerData = {
        id,
        phase: (phase as 'mount' | 'update') ?? 'update',
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        interactions,
      };

      // Update stats
      let stats = profilerStats.get(id);
      if (!stats) {
        stats = {
          totalRenders: 0,
          totalActualDuration: 0,
          totalBaseDuration: 0,
          averageActualDuration: 0,
          averageBaseDuration: 0,
          mountDuration: 0,
          updateDurations: [],
          slowRenders: [],
        };
        profilerStats.set(id, stats);
      }

      // Update statistics
      stats.totalRenders++;
      stats.totalActualDuration += actualDuration;
      stats.totalBaseDuration += baseDuration;
      stats.averageActualDuration =
        stats.totalActualDuration / stats.totalRenders;
      stats.averageBaseDuration = stats.totalBaseDuration / stats.totalRenders;

      if (phase === 'mount') {
        stats.mountDuration = actualDuration;
      } else {
        stats.updateDurations.push(actualDuration);
      }

      // Track slow renders
      if (actualDuration > slowRenderThreshold) {
        stats.slowRenders.push(data);
        console.warn(
          `🐌 Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms (${phase})`
        );
      }

      // Log performance data in development
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `⚡ ${id} rendered in ${actualDuration.toFixed(2)}ms (${phase})`
        );
      }
    },
    [enabled, slowRenderThreshold]
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}

/**
 * Get profiler statistics for a specific component
 */
export function getProfilerStats(id: string): ProfilerStats | undefined {
  return profilerStats.get(id);
}

/**
 * Get all profiler statistics
 */
export function getAllProfilerStats(): Map<string, ProfilerStats> {
  return new Map(profilerStats);
}

/**
 * Reset profiler statistics
 */
export function resetProfilerStats(id?: string) {
  if (id) {
    profilerStats.delete(id);
  } else {
    profilerStats.clear();
  }
}

/**
 * Generate profiler report
 */
export function generateProfilerReport(): string {
  const stats = Array.from(profilerStats.entries());

  if (stats.length === 0) {
    return 'No profiler data available';
  }

  let report = '⚡ React Profiler Report\n';
  report += '='.repeat(50) + '\n\n';

  stats.forEach(([id, stat]) => {
    report += `Component: ${id}\n`;
    report += `  Total Renders: ${stat.totalRenders}\n`;
    report += `  Mount Duration: ${stat.mountDuration.toFixed(2)}ms\n`;
    report += `  Average Render Time: ${stat.averageActualDuration.toFixed(2)}ms\n`;
    report += `  Average Base Duration: ${stat.averageBaseDuration.toFixed(2)}ms\n`;

    if (stat.updateDurations.length > 0) {
      const maxUpdate = Math.max(...stat.updateDurations);
      const minUpdate = Math.min(...stat.updateDurations);
      report += `  Update Range: ${minUpdate.toFixed(2)}ms - ${maxUpdate.toFixed(2)}ms\n`;
    }

    if (stat.slowRenders.length > 0) {
      report += `  Slow Renders: ${stat.slowRenders.length}\n`;
    }

    report += '\n';
  });

  return report;
}

/**
 * Hook to track component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderStartTime = React.useRef<number>(performance.now());
  const renderCount = React.useRef<number>(0);

  // Mark render start
  renderStartTime.current = performance.now();
  renderCount.current++;

  React.useEffect(() => {
    if (renderStartTime.current) {
      const renderDuration = performance.now() - renderStartTime.current;

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📊 ${componentName} render #${renderCount.current}: ${renderDuration.toFixed(2)}ms`
        );
      }

      // Warn about slow renders
      if (renderDuration > 16) {
        console.warn(
          `🐌 ${componentName} slow render: ${renderDuration.toFixed(2)}ms`
        );
      }
    }
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * Performance monitoring hook with detailed metrics
 */
export function usePerformanceMonitoring(componentName: string, _props?: any) {
  const renderStartTime = performance.now();
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    slowRenderCount: 0,
  });

  React.useEffect(() => {
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime;

    setMetrics((prev) => {
      const newRenderCount = prev.renderCount + 1;
      const totalTime =
        prev.averageRenderTime * prev.renderCount + renderDuration;
      const newAverageTime = totalTime / newRenderCount;
      const newSlowRenderCount =
        renderDuration > 16 ? prev.slowRenderCount + 1 : prev.slowRenderCount;

      return {
        renderCount: newRenderCount,
        averageRenderTime: newAverageTime,
        lastRenderTime: renderDuration,
        slowRenderCount: newSlowRenderCount,
      };
    });

    // Log performance metrics
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 ${componentName} metrics:`, {
        renderDuration: renderDuration.toFixed(2) + 'ms',
        renderCount: metrics.renderCount + 1,
        averageTime:
          (
            (metrics.averageRenderTime * metrics.renderCount + renderDuration) /
            (metrics.renderCount + 1)
          ).toFixed(2) + 'ms',
      });
    }
  });

  return metrics;
}

/**
 * Component wrapper that automatically adds profiling
 */
export function withReactProfiler<P extends object>(
  Component: React.ComponentType<P>,
  profileId?: string
) {
  const ProfiledComponent = React.forwardRef<any, P>((props, ref) => {
    const id =
      profileId || Component.displayName || Component.name || 'Unknown';

    return (
      <ReactProfiler id={id}>
        <Component {...(props as any)} ref={ref} />
      </ReactProfiler>
    );
  });

  ProfiledComponent.displayName = `Profiled(${Component.displayName || Component.name})`;

  return ProfiledComponent;
}

export default ReactProfiler;
