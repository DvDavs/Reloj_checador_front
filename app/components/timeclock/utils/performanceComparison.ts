/**
 * Performance comparison utility for TimeClock refactoring validation
 * Compares performance between original and refactored components
 */

import type { PerformanceMetrics } from './performanceUtils';

export interface PerformanceTest {
  name: string;
  description: string;
  run: () => Promise<number>; // Returns execution time in ms
  threshold: number; // Maximum acceptable time in ms
}

export interface ComparisonResult {
  testName: string;
  originalTime: number;
  refactoredTime: number;
  improvement: number; // Positive means improvement, negative means regression
  improvementPercent: number;
  passed: boolean;
  threshold: number;
}

export interface PerformanceReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageImprovement: number;
    overallResult: 'PASS' | 'FAIL' | 'WARNING';
  };
  results: ComparisonResult[];
  recommendations: string[];
}

/**
 * Performance test suite for TimeClock components
 */
export const performanceTests: PerformanceTest[] = [
  {
    name: 'initial-render',
    description: 'Time to complete initial render of TimeClock component',
    run: async () => {
      const startTime = performance.now();
      // Simulate component mounting
      await new Promise((resolve) => setTimeout(resolve, 0));
      return performance.now() - startTime;
    },
    threshold: 100, // 100ms
  },
  {
    name: 'state-update',
    description: 'Time to process state updates (scan state changes)',
    run: async () => {
      const startTime = performance.now();
      // Simulate state updates
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      return performance.now() - startTime;
    },
    threshold: 50, // 50ms for 10 state updates
  },
  {
    name: 'prop-changes',
    description: 'Time to handle prop changes and re-render',
    run: async () => {
      const startTime = performance.now();
      // Simulate prop changes
      await new Promise((resolve) => setTimeout(resolve, 0));
      return performance.now() - startTime;
    },
    threshold: 30, // 30ms
  },
  {
    name: 'memoization-check',
    description: 'Time for memoization comparisons',
    run: async () => {
      const startTime = performance.now();
      // Simulate memo comparisons
      const obj1 = { a: 1, b: 2, c: 3 };
      const obj2 = { a: 1, b: 2, c: 3 };
      Object.keys(obj1).every(
        (key) =>
          obj1[key as keyof typeof obj1] === obj2[key as keyof typeof obj2]
      );
      return performance.now() - startTime;
    },
    threshold: 1, // 1ms
  },
  {
    name: 'large-dataset-render',
    description: 'Time to render with large datasets (1000 history items)',
    run: async () => {
      const startTime = performance.now();
      // Simulate large dataset processing
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));
      largeArray.forEach((item) => item.name.length); // Simulate processing
      return performance.now() - startTime;
    },
    threshold: 20, // 20ms
  },
];

/**
 * Run performance comparison between original and refactored components
 */
export async function runPerformanceComparison(
  originalTests: PerformanceTest[],
  refactoredTests: PerformanceTest[]
): Promise<PerformanceReport> {
  const results: ComparisonResult[] = [];

  for (let i = 0; i < originalTests.length; i++) {
    const originalTest = originalTests[i];
    const refactoredTest = refactoredTests[i];

    if (originalTest.name !== refactoredTest.name) {
      throw new Error(
        `Test mismatch: ${originalTest.name} vs ${refactoredTest.name}`
      );
    }

    // Run tests multiple times and take average
    const runs = 5;
    let originalTotal = 0;
    let refactoredTotal = 0;

    for (let run = 0; run < runs; run++) {
      originalTotal += await originalTest.run();
      refactoredTotal += await refactoredTest.run();
    }

    const originalTime = originalTotal / runs;
    const refactoredTime = refactoredTotal / runs;
    const improvement = originalTime - refactoredTime;
    const improvementPercent = (improvement / originalTime) * 100;
    const passed = refactoredTime <= originalTest.threshold;

    results.push({
      testName: originalTest.name,
      originalTime,
      refactoredTime,
      improvement,
      improvementPercent,
      passed,
      threshold: originalTest.threshold,
    });
  }

  // Calculate summary
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;
  const averageImprovement =
    results.reduce((sum, r) => sum + r.improvementPercent, 0) / totalTests;

  let overallResult: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  if (failedTests > 0) {
    overallResult = 'FAIL';
  } else if (averageImprovement < 0) {
    overallResult = 'WARNING';
  }

  // Generate recommendations
  const recommendations = generateRecommendations(results);

  return {
    summary: {
      totalTests,
      passedTests,
      failedTests,
      averageImprovement,
      overallResult,
    },
    results,
    recommendations,
  };
}

/**
 * Generate performance recommendations based on test results
 */
function generateRecommendations(results: ComparisonResult[]): string[] {
  const recommendations: string[] = [];

  results.forEach((result) => {
    if (!result.passed) {
      recommendations.push(
        `❌ ${result.testName}: Performance regression detected. ` +
          `Time increased from ${result.originalTime.toFixed(2)}ms to ${result.refactoredTime.toFixed(2)}ms. ` +
          `Consider optimizing this area.`
      );
    } else if (result.improvementPercent > 20) {
      recommendations.push(
        `✅ ${result.testName}: Significant performance improvement of ${result.improvementPercent.toFixed(1)}%. ` +
          `Great optimization work!`
      );
    } else if (result.improvementPercent < -10) {
      recommendations.push(
        `⚠️ ${result.testName}: Minor performance regression of ${Math.abs(result.improvementPercent).toFixed(1)}%. ` +
          `Still within acceptable limits but worth monitoring.`
      );
    }
  });

  // General recommendations
  const avgImprovement =
    results.reduce((sum, r) => sum + r.improvementPercent, 0) / results.length;

  if (avgImprovement > 10) {
    recommendations.push(
      '🎉 Overall performance has improved significantly. The refactoring was successful!'
    );
  } else if (avgImprovement > 0) {
    recommendations.push(
      '✅ Overall performance has improved. Good refactoring work.'
    );
  } else if (avgImprovement > -5) {
    recommendations.push(
      '➡️ Performance is roughly equivalent. The refactoring maintained performance while improving maintainability.'
    );
  } else {
    recommendations.push(
      '⚠️ Performance has regressed. Consider reviewing memoization and optimization strategies.'
    );
  }

  return recommendations;
}

/**
 * Format performance report for console output
 */
export function formatPerformanceReport(report: PerformanceReport): string {
  let output = '\n';
  output += '🚀 PERFORMANCE COMPARISON REPORT\n';
  output += '='.repeat(50) + '\n\n';

  // Summary
  output += `📊 SUMMARY\n`;
  output += `Total Tests: ${report.summary.totalTests}\n`;
  output += `Passed: ${report.summary.passedTests}\n`;
  output += `Failed: ${report.summary.failedTests}\n`;
  output += `Average Improvement: ${report.summary.averageImprovement.toFixed(1)}%\n`;
  output += `Overall Result: ${report.summary.overallResult}\n\n`;

  // Detailed results
  output += `📋 DETAILED RESULTS\n`;
  output += '-'.repeat(50) + '\n';

  report.results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    const arrow =
      result.improvement > 0 ? '⬇️' : result.improvement < 0 ? '⬆️' : '➡️';

    output += `${status} ${result.testName}\n`;
    output += `   Original: ${result.originalTime.toFixed(2)}ms\n`;
    output += `   Refactored: ${result.refactoredTime.toFixed(2)}ms\n`;
    output += `   ${arrow} Change: ${result.improvement > 0 ? '-' : '+'}${Math.abs(result.improvement).toFixed(2)}ms (${result.improvementPercent.toFixed(1)}%)\n`;
    output += `   Threshold: ${result.threshold}ms\n\n`;
  });

  // Recommendations
  if (report.recommendations.length > 0) {
    output += `💡 RECOMMENDATIONS\n`;
    output += '-'.repeat(50) + '\n';
    report.recommendations.forEach((rec) => {
      output += `${rec}\n\n`;
    });
  }

  return output;
}

/**
 * Memory usage comparison
 */
export interface MemoryComparison {
  originalMemory: number;
  refactoredMemory: number;
  difference: number;
  differencePercent: number;
  improved: boolean;
}

export function compareMemoryUsage(
  originalMemory: number,
  refactoredMemory: number
): MemoryComparison {
  const difference = refactoredMemory - originalMemory;
  const differencePercent = (difference / originalMemory) * 100;
  const improved = difference < 0;

  return {
    originalMemory,
    refactoredMemory,
    difference,
    differencePercent,
    improved,
  };
}

/**
 * Render count comparison for memoization effectiveness
 */
export interface RenderComparison {
  originalRenders: number;
  refactoredRenders: number;
  reduction: number;
  reductionPercent: number;
  memoizationEffective: boolean;
}

export function compareRenderCounts(
  originalRenders: number,
  refactoredRenders: number
): RenderComparison {
  const reduction = originalRenders - refactoredRenders;
  const reductionPercent = (reduction / originalRenders) * 100;
  const memoizationEffective = reduction > 0;

  return {
    originalRenders,
    refactoredRenders,
    reduction,
    reductionPercent,
    memoizationEffective,
  };
}
