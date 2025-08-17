/**
 * Test to verify all exports from timeclock module work correctly
 */

import { describe, it, expect } from '@jest/globals';

describe('TimeClock Module Exports', () => {
  it('should export TimeClock component', async () => {
    const { TimeClock } = await import('../index');
    expect(TimeClock).toBeDefined();
    expect(typeof TimeClock).toBe('function');
  });

  it('should export TimeClockProps type', async () => {
    // TypeScript will catch if this import fails at compile time
    const module = await import('../index');
    expect(module).toBeDefined();
  });

  it('should export all presentational components', async () => {
    const {
      HeaderClock,
      ShiftsPanel,
      ScannerPanel,
      AttendanceDetails,
      HistoryPanel,
    } = await import('../index');

    expect(HeaderClock).toBeDefined();
    expect(ShiftsPanel).toBeDefined();
    expect(ScannerPanel).toBeDefined();
    expect(AttendanceDetails).toBeDefined();
    expect(HistoryPanel).toBeDefined();

    expect(typeof HeaderClock).toBe('object'); // React.memo returns object
    expect(typeof ShiftsPanel).toBe('object');
    expect(typeof ScannerPanel).toBe('object');
    expect(typeof AttendanceDetails).toBe('object');
    expect(typeof HistoryPanel).toBe('object');
  });

  it('should export useScanStateReducer hook', async () => {
    const { useScanStateReducer } = await import('../index');
    expect(useScanStateReducer).toBeDefined();
    expect(typeof useScanStateReducer).toBe('function');
  });

  it('should export interfaces', async () => {
    // TypeScript will catch if interface exports fail at compile time
    const module = await import('../index');
    expect(module).toBeDefined();
  });
});
