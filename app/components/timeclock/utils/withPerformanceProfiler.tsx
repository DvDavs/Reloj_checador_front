'use client';

import React from 'react';
import { usePerformanceProfiler } from './performanceUtils';

/**
 * Higher-order component that adds performance profiling to any React component
 */
export function withPerformanceProfiler<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const ProfiledComponent = React.forwardRef<any, P>((props, ref) => {
    const name =
      componentName ||
      WrappedComponent.displayName ||
      WrappedComponent.name ||
      'Unknown';

    // Track performance metrics
    const { renderCount } = usePerformanceProfiler(name, props);

    // Add render count to dev tools (only in development)
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'development') {
        (WrappedComponent as any).__renderCount = renderCount;
      }
    }, [renderCount]);

    return <WrappedComponent {...(props as any)} ref={ref} />;
  });

  ProfiledComponent.displayName = `withPerformanceProfiler(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return ProfiledComponent;
}

/**
 * Hook to track re-renders and their causes
 */
export function useRenderTracker(
  componentName: string,
  props: Record<string, any>
) {
  const prevProps = React.useRef<Record<string, any>>({});
  const renderCount = React.useRef<number>(0);

  React.useEffect(() => {
    renderCount.current += 1;

    if (prevProps.current) {
      const changedProps: string[] = [];

      Object.keys(props).forEach((key) => {
        if (prevProps.current![key] !== props[key]) {
          changedProps.push(key);
        }
      });

      if (changedProps.length > 0) {
        console.log(
          `🔄 ${componentName} re-rendered (${renderCount.current}) due to props:`,
          changedProps
        );
      }
    }

    prevProps.current = { ...props };
  });

  return renderCount.current;
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useUnnecessaryRenderDetector(
  componentName: string,
  dependencies: any[]
) {
  const prevDeps = React.useRef<any[]>([]);
  const renderCount = React.useRef<number>(0);

  React.useEffect(() => {
    renderCount.current += 1;

    if (prevDeps.current) {
      const hasChanged = dependencies.some(
        (dep, index) => !Object.is(dep, prevDeps.current![index])
      );

      if (!hasChanged) {
        console.warn(
          `⚠️ ${componentName} re-rendered unnecessarily (render #${renderCount.current})`
        );
      }
    }

    prevDeps.current = [...dependencies];
  });
}

/**
 * Performance-aware memo with custom comparison and logging
 */
export function performanceMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean,
  componentName?: string
) {
  const name =
    componentName || Component.displayName || Component.name || 'Unknown';

  const customAreEqual = (prevProps: P, nextProps: P): boolean => {
    const startTime = performance.now();

    let result: boolean;
    if (areEqual) {
      result = areEqual(prevProps, nextProps);
    } else {
      // Default shallow comparison
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);

      if (prevKeys.length !== nextKeys.length) {
        result = false;
      } else {
        result = prevKeys.every((key) =>
          Object.is(prevProps[key as keyof P], nextProps[key as keyof P])
        );
      }
    }

    const endTime = performance.now();
    const comparisonTime = endTime - startTime;

    // Log slow comparisons
    if (comparisonTime > 1) {
      console.warn(
        `🐌 Slow memo comparison in ${name}: ${comparisonTime.toFixed(2)}ms`
      );
    }

    // Log when memo prevents re-render
    if (result && process.env.NODE_ENV === 'development') {
      console.log(`✅ ${name} memo prevented re-render`);
    }

    return result;
  };

  return React.memo(Component, customAreEqual);
}

export default withPerformanceProfiler;
