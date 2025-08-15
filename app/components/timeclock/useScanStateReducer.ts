import { useCallback, useMemo, useReducer } from 'react';

import type {
  PanelFlash,
  ScanAction,
  ScanReducerState,
  ScanStateType,
} from './interfaces';

export const getInitialScanReducerState = (
  overrides?: Partial<ScanReducerState>
): ScanReducerState => ({
  scanState: 'idle',
  scanResult: null,
  customMessage: null,
  panelFlash: null,
  statusCode: null,
  statusData: null,
  ...overrides,
});

export function scanStateReducer(
  state: ScanReducerState,
  action: ScanAction
): ScanReducerState {
  switch (action.type) {
    case 'SET_SCANNING':
      return {
        ...state,
        scanState: 'scanning',
        scanResult: null,
        customMessage: null,
        panelFlash: null,
        statusCode: null,
        statusData: null,
      };
    case 'SET_SUCCESS': {
      const message = action.message ?? null;
      const statusCode = action.statusCode ?? null;
      const statusData = action.statusData ?? null;
      return {
        ...state,
        scanState: 'success',
        scanResult: 'success',
        customMessage: message,
        panelFlash: 'success',
        statusCode,
        statusData,
      };
    }
    case 'SET_FAILED': {
      const message = action.message ?? null;
      const statusCode = action.statusCode ?? null;
      const statusData = action.statusData ?? null;
      return {
        ...state,
        scanState: 'failed',
        scanResult: 'failed',
        customMessage: message,
        panelFlash: 'failed',
        statusCode,
        statusData,
      };
    }
    case 'SET_READY':
      return {
        ...state,
        scanState: 'ready',
        scanResult: null,
        customMessage: null,
        panelFlash: null,
        statusCode: null,
        statusData: null,
      };
    case 'SET_IDLE':
      return {
        ...state,
        scanState: 'idle',
        scanResult: null,
        customMessage: null,
        panelFlash: null,
        statusCode: null,
        statusData: null,
      };
    case 'RESET':
      return getInitialScanReducerState();
    default:
      return state;
  }
}

export interface UseScanStateReducerResult {
  state: ScanReducerState;
  setScanning: () => void;
  setSuccess: (params?: {
    message?: string | null;
    statusCode?: string | null;
    statusData?: Record<string, any> | null;
  }) => void;
  setFailed: (params?: {
    message?: string | null;
    statusCode?: string | null;
    statusData?: Record<string, any> | null;
  }) => void;
  setReady: () => void;
  setIdle: () => void;
  reset: () => void;
  dispatch: React.Dispatch<ScanAction>;
}

export function useScanStateReducer(
  initialState?: Partial<ScanReducerState>
): UseScanStateReducerResult {
  const [state, dispatch] = useReducer(
    scanStateReducer,
    getInitialScanReducerState(initialState)
  );

  const setScanning = useCallback(() => {
    dispatch({ type: 'SET_SCANNING' });
  }, []);

  const setSuccess = useCallback(
    (params?: {
      message?: string | null;
      statusCode?: string | null;
      statusData?: Record<string, any> | null;
    }) => {
      dispatch({
        type: 'SET_SUCCESS',
        message: params?.message,
        statusCode: params?.statusCode,
        statusData: params?.statusData,
      });
    },
    []
  );

  const setFailed = useCallback(
    (params?: {
      message?: string | null;
      statusCode?: string | null;
      statusData?: Record<string, any> | null;
    }) => {
      dispatch({
        type: 'SET_FAILED',
        message: params?.message,
        statusCode: params?.statusCode,
        statusData: params?.statusData,
      });
    },
    []
  );

  const setReady = useCallback(() => {
    dispatch({ type: 'SET_READY' });
  }, []);

  const setIdle = useCallback(() => {
    dispatch({ type: 'SET_IDLE' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return useMemo(
    () => ({
      state,
      setScanning,
      setSuccess,
      setFailed,
      setReady,
      setIdle,
      reset,
      dispatch,
    }),
    [state, setScanning, setSuccess, setFailed, setReady, setIdle, reset]
  );
}

export type { ScanReducerState, ScanStateType, PanelFlash };
