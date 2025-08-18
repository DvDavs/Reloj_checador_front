'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getAllMetrics,
  generatePerformanceReport,
  resetMetrics,
  type PerformanceMetrics,
} from './performanceUtils';

interface PerformanceMonitorProps {
  enabled?: boolean;
  autoReport?: boolean;
  reportInterval?: number;
}

export function PerformanceMonitor({
  enabled = true,
  autoReport = false,
  reportInterval = 5000,
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<Map<string, PerformanceMetrics>>(
    new Map()
  );
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<string>('');

  const updateMetrics = useCallback(() => {
    if (enabled) {
      setMetrics(new Map(getAllMetrics()));
    }
  }, [enabled]);

  const generateReport = useCallback(() => {
    const newReport = generatePerformanceReport();
    setReport(newReport);
    console.log(newReport);
  }, []);

  const handleReset = useCallback(() => {
    resetMetrics();
    setMetrics(new Map());
    setReport('');
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, [enabled, updateMetrics]);

  // Auto-generate reports
  useEffect(() => {
    if (!autoReport || !enabled) return;

    const interval = setInterval(generateReport, reportInterval);
    return () => clearInterval(interval);
  }, [autoReport, enabled, reportInterval, generateReport]);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!enabled || !isVisible) {
    return (
      <div className='fixed bottom-4 right-4 z-50'>
        <Button
          onClick={() => setIsVisible(true)}
          variant='outline'
          size='sm'
          className='bg-black/80 text-white border-gray-600 hover:bg-gray-800'
        >
          📊 Performance
        </Button>
      </div>
    );
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-auto'>
      <Card className='bg-black/90 text-white border-gray-600 p-4'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>Performance Monitor</h3>
          <div className='flex gap-2'>
            <Button onClick={generateReport} size='sm' variant='outline'>
              📊 Report
            </Button>
            <Button onClick={handleReset} size='sm' variant='outline'>
              🔄 Reset
            </Button>
            <Button
              onClick={() => setIsVisible(false)}
              size='sm'
              variant='outline'
            >
              ✕
            </Button>
          </div>
        </div>

        <div className='space-y-2 text-sm'>
          {Array.from(metrics.entries()).map(([componentName, metric]) => (
            <div key={componentName} className='border-b border-gray-700 pb-2'>
              <div className='font-medium'>{componentName}</div>
              <div className='text-gray-300'>
                Renders: {metric.renderCount} | Avg:{' '}
                {metric.averageRenderTime.toFixed(2)}ms | Max:{' '}
                {metric.maxRenderTime.toFixed(2)}ms
              </div>
              {metric.renderTimes.length > 0 && (
                <div className='text-xs text-gray-400'>
                  Last 5:{' '}
                  {metric.renderTimes
                    .slice(-5)
                    .map((t) => t.toFixed(1))
                    .join(', ')}
                  ms
                </div>
              )}
            </div>
          ))}
        </div>

        {report && (
          <div className='mt-4'>
            <h4 className='font-medium mb-2'>Latest Report:</h4>
            <pre className='text-xs bg-gray-900 p-2 rounded overflow-auto max-h-32'>
              {report}
            </pre>
          </div>
        )}

        <div className='mt-4 text-xs text-gray-400'>
          Press Ctrl+Shift+P to toggle | Updates every second
        </div>
      </Card>
    </div>
  );
}

export default PerformanceMonitor;
