'use client';

import React, { useState, useEffect } from 'react';
import {
  performanceMonitor,
  type RenderMetrics,
} from './utils/performanceMonitor';
import { performanceTester } from './utils/performanceTest';

interface PerformanceDebuggerProps {
  enabled?: boolean;
}

export function PerformanceDebugger({
  enabled = process.env.NODE_ENV === 'development',
}: PerformanceDebuggerProps) {
  const [metrics, setMetrics] = useState<RenderMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!enabled || !autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getAllMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, autoRefresh]);

  const handleRunTest = () => {
    const report = performanceTester.generateReport();
    console.log(report);
    alert('Performance test completed! Check console for detailed report.');
  };

  const handleReset = () => {
    performanceMonitor.reset();
    setMetrics([]);
  };

  if (!enabled) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className='fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg'
        title='Toggle Performance Debugger'
      >
        📊 Perf
      </button>

      {/* Performance panel */}
      {isVisible && (
        <div className='fixed bottom-16 right-4 z-50 bg-black/90 text-white p-4 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-auto'>
          <div className='flex justify-between items-center mb-3'>
            <h3 className='text-lg font-bold'>Performance Monitor</h3>
            <button
              onClick={() => setIsVisible(false)}
              className='text-gray-400 hover:text-white'
            >
              ✕
            </button>
          </div>

          <div className='space-y-3'>
            {/* Controls */}
            <div className='flex gap-2 text-xs'>
              <button
                onClick={handleRunTest}
                className='bg-green-600 hover:bg-green-700 px-2 py-1 rounded'
              >
                Run Test
              </button>
              <button
                onClick={handleReset}
                className='bg-red-600 hover:bg-red-700 px-2 py-1 rounded'
              >
                Reset
              </button>
              <label className='flex items-center gap-1'>
                <input
                  type='checkbox'
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className='w-3 h-3'
                />
                Auto
              </label>
            </div>

            {/* Metrics */}
            {metrics.length === 0 ? (
              <p className='text-gray-400 text-sm'>
                No performance data yet...
              </p>
            ) : (
              <div className='space-y-2'>
                {metrics.map((metric) => {
                  const isGood = metric.averageRenderTime < 16;
                  const isFair = metric.averageRenderTime < 32;

                  return (
                    <div
                      key={metric.componentName}
                      className={`p-2 rounded text-xs ${
                        isGood
                          ? 'bg-green-900/50'
                          : isFair
                            ? 'bg-yellow-900/50'
                            : 'bg-red-900/50'
                      }`}
                    >
                      <div className='flex justify-between items-center'>
                        <span className='font-medium'>
                          {metric.componentName}
                        </span>
                        <span
                          className={`text-xs ${
                            isGood
                              ? 'text-green-400'
                              : isFair
                                ? 'text-yellow-400'
                                : 'text-red-400'
                          }`}
                        >
                          {isGood ? '✅' : isFair ? '⚠️' : '❌'}
                        </span>
                      </div>
                      <div className='text-gray-300 mt-1'>
                        <div>Renders: {metric.renderCount}</div>
                        <div>Avg: {metric.averageRenderTime.toFixed(1)}ms</div>
                        <div>Last: {metric.lastRenderTime.toFixed(1)}ms</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary */}
            {metrics.length > 0 && (
              <div className='border-t border-gray-600 pt-2 text-xs text-gray-300'>
                <div>Total Components: {metrics.length}</div>
                <div>
                  Avg Render Time:{' '}
                  {(
                    metrics.reduce((sum, m) => sum + m.averageRenderTime, 0) /
                    metrics.length
                  ).toFixed(1)}
                  ms
                </div>
                <div>
                  Total Renders:{' '}
                  {metrics.reduce((sum, m) => sum + m.renderCount, 0)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
