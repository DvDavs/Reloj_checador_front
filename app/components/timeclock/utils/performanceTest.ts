// Performance testing utilities for TimeClock components
// Helps verify optimization effectiveness

import { performanceMonitor } from './performanceMonitor';

interface PerformanceTestResult {
  componentName: string;
  passed: boolean;
  averageRenderTime: number;
  renderCount: number;
  issues: string[];
}

interface PerformanceThresholds {
  maxAverageRenderTime: number; // milliseconds
  minRenderCount: number; // minimum renders to consider test valid
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxAverageRenderTime: 16, // 60fps = 16.67ms per frame
  minRenderCount: 5, // need at least 5 renders for meaningful average
};

/**
 * Test performance of TimeClock components
 */
export class PerformanceTester {
  private thresholds: PerformanceThresholds;

  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Test a specific component's performance
   */
  testComponent(componentName: string): PerformanceTestResult {
    const metrics = performanceMonitor.getMetrics(componentName);
    const issues: string[] = [];

    if (!metrics) {
      return {
        componentName,
        passed: false,
        averageRenderTime: 0,
        renderCount: 0,
        issues: [
          'No performance data available - component may not be instrumented',
        ],
      };
    }

    // Check if we have enough data
    if (metrics.renderCount < this.thresholds.minRenderCount) {
      issues.push(
        `Insufficient render data (${metrics.renderCount} < ${this.thresholds.minRenderCount})`
      );
    }

    // Check average render time
    if (metrics.averageRenderTime > this.thresholds.maxAverageRenderTime) {
      issues.push(
        `Average render time too high (${metrics.averageRenderTime.toFixed(2)}ms > ${this.thresholds.maxAverageRenderTime}ms)`
      );
    }

    // Check for render time consistency (high variance indicates optimization issues)
    if (metrics.renderTimes.length > 1) {
      const variance = this.calculateVariance(metrics.renderTimes);
      const standardDeviation = Math.sqrt(variance);

      if (standardDeviation > metrics.averageRenderTime * 0.5) {
        issues.push(
          `High render time variance (σ=${standardDeviation.toFixed(2)}ms) - inconsistent performance`
        );
      }
    }

    return {
      componentName,
      passed:
        issues.length === 0 &&
        metrics.renderCount >= this.thresholds.minRenderCount,
      averageRenderTime: metrics.averageRenderTime,
      renderCount: metrics.renderCount,
      issues,
    };
  }

  /**
   * Test all instrumented components
   */
  testAllComponents(): PerformanceTestResult[] {
    const allMetrics = performanceMonitor.getAllMetrics();
    return allMetrics.map((metric) => this.testComponent(metric.componentName));
  }

  /**
   * Run a comprehensive performance test suite
   */
  runTestSuite(): {
    passed: boolean;
    results: PerformanceTestResult[];
    summary: {
      totalComponents: number;
      passedComponents: number;
      failedComponents: number;
      averageRenderTime: number;
    };
  } {
    const results = this.testAllComponents();
    const passedComponents = results.filter((r) => r.passed).length;
    const totalComponents = results.length;
    const averageRenderTime =
      results.reduce((sum, r) => sum + r.averageRenderTime, 0) /
      totalComponents;

    return {
      passed: passedComponents === totalComponents && totalComponents > 0,
      results,
      summary: {
        totalComponents,
        passedComponents,
        failedComponents: totalComponents - passedComponents,
        averageRenderTime,
      },
    };
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const testSuite = this.runTestSuite();

    let report = '🚀 TimeClock Performance Test Report\n';
    report += '=====================================\n\n';

    report += `Overall Status: ${testSuite.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `Components Tested: ${testSuite.summary.totalComponents}\n`;
    report += `Passed: ${testSuite.summary.passedComponents}\n`;
    report += `Failed: ${testSuite.summary.failedComponents}\n`;
    report += `Average Render Time: ${testSuite.summary.averageRenderTime.toFixed(2)}ms\n\n`;

    if (testSuite.results.length === 0) {
      report +=
        '⚠️ No components found. Make sure performance monitoring is enabled.\n';
      return report;
    }

    report += 'Component Details:\n';
    report += '-----------------\n';

    testSuite.results.forEach((result) => {
      const status = result.passed ? '✅' : '❌';
      report += `${status} ${result.componentName}\n`;
      report += `   Renders: ${result.renderCount}\n`;
      report += `   Avg Time: ${result.averageRenderTime.toFixed(2)}ms\n`;

      if (result.issues.length > 0) {
        report += `   Issues:\n`;
        result.issues.forEach((issue) => {
          report += `     - ${issue}\n`;
        });
      }
      report += '\n';
    });

    // Optimization recommendations
    const failedComponents = testSuite.results.filter((r) => !r.passed);
    if (failedComponents.length > 0) {
      report += 'Optimization Recommendations:\n';
      report += '----------------------------\n';

      failedComponents.forEach((component) => {
        report += `${component.componentName}:\n`;

        if (
          component.averageRenderTime > this.thresholds.maxAverageRenderTime
        ) {
          report += '  - Consider adding React.memo with custom comparison\n';
          report += '  - Use useMemo for expensive calculations\n';
          report += '  - Use useCallback for event handlers\n';
        }

        if (component.issues.some((i) => i.includes('variance'))) {
          report +=
            '  - Inconsistent render times - check for unstable dependencies\n';
          report += '  - Ensure props objects are memoized\n';
        }

        report += '\n';
      });
    }

    return report;
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDifferences = numbers.map((num) => Math.pow(num - mean, 2));
    return (
      squaredDifferences.reduce((sum, diff) => sum + diff, 0) / numbers.length
    );
  }
}

// Export a default instance
export const performanceTester = new PerformanceTester();

// Development helper functions
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Expose performance tester to window for debugging
  (window as any).__timeClockPerformanceTester = performanceTester;

  // Add console command to run performance tests
  (window as any).runPerformanceTest = () => {
    console.log(performanceTester.generateReport());
  };
}
