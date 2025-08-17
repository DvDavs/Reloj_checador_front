import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimeClock from '../TimeClock';
import type { TimeClockProps } from '../TimeClock';

// Mock the hooks
jest.mock('../../../hooks/useStompTimeClock', () => ({
  __esModule: true,
  default: () => ({
    isConnected: true,
  }),
}));

jest.mock('../../../hooks/useEmployeeAttendanceData', () => ({
  __esModule: true,
  default: () => ({
    currentEmployeeData: null,
    jornadasDelDia: [],
    activeSessionId: null,
    nextRecommendedAction: null,
    isLoading: false,
    updateFromFullAttendanceEvent: jest.fn(),
  }),
}));

// Mock Web Audio API
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    type: 'sine',
    frequency: { setValueAtTime: jest.fn() },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  })),
  destination: {},
  currentTime: 0,
};

// Mock Audio constructor
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
};

beforeAll(() => {
  // Mock AudioContext
  (global as any).AudioContext = jest.fn(() => mockAudioContext);

  // Mock Audio constructor
  (global as any).Audio = jest.fn(() => mockAudio);
});

describe('TimeClock Audio Functionality Tests', () => {
  const defaultProps: TimeClockProps = {
    selectedReader: 'test-reader',
    sessionId: 'test-session',
    instanceId: 'test-instance',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Audio Controls', () => {
    it('should display sound toggle in header', () => {
      render(<TimeClock {...defaultProps} />);

      const soundToggle = screen.getByTestId('sound-toggle');
      expect(soundToggle).toBeInTheDocument();
    });

    it('should display sound toggle in history panel', () => {
      render(<TimeClock {...defaultProps} />);

      // Look for the sound control in history panel
      const historyPanel = screen.getByText('Últimos Registros').closest('div');
      expect(historyPanel).toBeInTheDocument();

      // Should have sound toggle button
      const soundButton = screen.getByTitle(/sonido/i);
      expect(soundButton).toBeInTheDocument();
    });

    it('should toggle sound state when clicked', async () => {
      render(<TimeClock {...defaultProps} />);

      const soundToggle = screen.getByTestId('sound-toggle');

      // Initially should be enabled (checked)
      expect(soundToggle).toBeChecked();

      // Click to disable
      fireEvent.click(soundToggle);

      await waitFor(() => {
        expect(soundToggle).not.toBeChecked();
      });

      // Click to enable again
      fireEvent.click(soundToggle);

      await waitFor(() => {
        expect(soundToggle).toBeChecked();
      });
    });

    it('should sync sound state between header and history panel', async () => {
      render(<TimeClock {...defaultProps} />);

      const headerToggle = screen.getByTestId('sound-toggle');
      const historyToggle = screen.getByTitle(/sonido/i);

      // Initially both should show sound enabled
      expect(headerToggle).toBeChecked();

      // Toggle from header
      fireEvent.click(headerToggle);

      await waitFor(() => {
        expect(headerToggle).not.toBeChecked();
        // History panel should show OFF state
        expect(screen.getByText('OFF')).toBeInTheDocument();
      });

      // Toggle from history panel
      fireEvent.click(historyToggle);

      await waitFor(() => {
        expect(headerToggle).toBeChecked();
        expect(screen.getByText('ON')).toBeInTheDocument();
      });
    });
  });

  describe('Audio Initialization', () => {
    it('should initialize Web Audio API components', () => {
      render(<TimeClock {...defaultProps} />);

      // Should create AudioContext
      expect(global.AudioContext).toHaveBeenCalled();

      // Should create Audio elements
      expect(global.Audio).toHaveBeenCalledTimes(3); // success, error, scan
    });

    it('should handle AudioContext initialization errors gracefully', () => {
      // Mock AudioContext to throw error
      const originalAudioContext = global.AudioContext;
      (global as any).AudioContext = jest.fn(() => {
        throw new Error('AudioContext not supported');
      });

      // Should not throw error
      expect(() => {
        render(<TimeClock {...defaultProps} />);
      }).not.toThrow();

      // Restore original
      (global as any).AudioContext = originalAudioContext;
    });
  });

  describe('Audio Feedback Integration', () => {
    it('should integrate with scan state changes', () => {
      const { rerender } = render(<TimeClock {...defaultProps} />);

      // Audio should be initialized
      expect(global.Audio).toHaveBeenCalled();
      expect(global.AudioContext).toHaveBeenCalled();

      // Component should render without errors
      expect(screen.getByText('Últimos Registros')).toBeInTheDocument();
    });

    it('should respect sound enabled state', async () => {
      render(<TimeClock {...defaultProps} />);

      const soundToggle = screen.getByTestId('sound-toggle');

      // Disable sound
      fireEvent.click(soundToggle);

      await waitFor(() => {
        expect(soundToggle).not.toBeChecked();
      });

      // Sound should be disabled in the component
      expect(screen.getByText('OFF')).toBeInTheDocument();
    });
  });

  describe('Audio Hook Integration', () => {
    it('should use audio feedback hook correctly', () => {
      // This test ensures the hook is properly integrated
      const { container } = render(<TimeClock {...defaultProps} />);

      // Component should render successfully with audio hook
      expect(container.firstChild).toBeInTheDocument();

      // Audio elements should be created
      expect(global.Audio).toHaveBeenCalled();
    });
  });
});
