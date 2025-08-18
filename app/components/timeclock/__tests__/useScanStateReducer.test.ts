import { describe, test, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import {
  useScanStateReducer,
  getInitialScanReducerState,
  scanStateReducer,
} from '../useScanStateReducer';

describe('useScanStateReducer', () => {
  test('initial state is idle with nulls', () => {
    const { result } = renderHook(() => useScanStateReducer());
    expect(result.current.state).toEqual(getInitialScanReducerState());
  });

  test('SET_SCANNING transition', () => {
    const { result } = renderHook(() => useScanStateReducer());
    act(() => result.current.setScanning());
    expect(result.current.state.scanState).toBe('scanning');
    expect(result.current.state.scanResult).toBeNull();
    expect(result.current.state.panelFlash).toBeNull();
  });

  test('SET_SUCCESS transition with payload', () => {
    const { result } = renderHook(() => useScanStateReducer());
    const payload = {
      message: 'OK',
      statusCode: 'ATTENDANCE_OK',
      statusData: { a: 1 },
    } as const;
    act(() => result.current.setSuccess(payload));
    expect(result.current.state.scanState).toBe('success');
    expect(result.current.state.scanResult).toBe('success');
    expect(result.current.state.customMessage).toBe('OK');
    expect(result.current.state.panelFlash).toBe('success');
    expect(result.current.state.statusCode).toBe('ATTENDANCE_OK');
    expect(result.current.state.statusData).toEqual({ a: 1 });
  });

  test('SET_FAILED transition with payload', () => {
    const { result } = renderHook(() => useScanStateReducer());
    const payload = {
      message: 'FAIL',
      statusCode: 'ERR_NO_MATCH',
      statusData: { e: true },
    } as const;
    act(() => result.current.setFailed(payload));
    expect(result.current.state.scanState).toBe('failed');
    expect(result.current.state.scanResult).toBe('failed');
    expect(result.current.state.customMessage).toBe('FAIL');
    expect(result.current.state.panelFlash).toBe('failed');
    expect(result.current.state.statusCode).toBe('ERR_NO_MATCH');
    expect(result.current.state.statusData).toEqual({ e: true });
  });

  test('SET_READY and SET_IDLE transitions clear transient state', () => {
    const { result } = renderHook(() =>
      useScanStateReducer({
        customMessage: 'x',
        statusCode: 'y',
        statusData: { z: 1 },
      })
    );

    act(() => result.current.setReady());
    expect(result.current.state.scanState).toBe('ready');
    expect(result.current.state.customMessage).toBeNull();
    expect(result.current.state.statusCode).toBeNull();
    expect(result.current.state.statusData).toBeNull();

    act(() => result.current.setIdle());
    expect(result.current.state.scanState).toBe('idle');
    expect(result.current.state.customMessage).toBeNull();
    expect(result.current.state.statusCode).toBeNull();
    expect(result.current.state.statusData).toBeNull();
  });

  test('RESET returns to initial state', () => {
    const { result } = renderHook(() => useScanStateReducer());
    act(() => result.current.setSuccess({ message: 'x' }));
    act(() => result.current.reset());
    expect(result.current.state).toEqual(getInitialScanReducerState());
  });
});

describe('scanStateReducer pure function', () => {
  test('unknown action returns same state', () => {
    const initial = getInitialScanReducerState();
    // @ts-expect-error testing fall-through
    const next = scanStateReducer(initial, { type: 'UNKNOWN' });
    expect(next).toBe(initial);
  });
});
