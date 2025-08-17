// Main TimeClock component - default export for backward compatibility
export { default as TimeClock } from './TimeClock';

// Export TimeClock props type for external usage
export type { TimeClockProps } from './TimeClock';

// Presentational components - exported as named exports
export { HeaderClock } from './HeaderClock';
export { ShiftsPanel } from './ShiftsPanel';
export { ScannerPanel } from './ScannerPanel';
export { AttendanceDetails } from './AttendanceDetails';
export { HistoryPanel } from './HistoryPanel';

// Hooks and utilities
export { useScanStateReducer } from './useScanStateReducer';
export type { UseScanStateReducerResult } from './useScanStateReducer';
export { useAudioFeedback } from './hooks/useAudioFeedback';
export type { UseAudioFeedbackProps } from './hooks/useAudioFeedback';

// Component interfaces and types
export * from './interfaces';
