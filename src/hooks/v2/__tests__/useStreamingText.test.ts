/**
 * useStreamingText Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStreamingText } from '../useStreamingText';

// Mock EventSource
class MockEventSource {
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;

  constructor(url: string) {
    this.url = url;
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    }, 10);
  }

  close() {
    this.readyState = 2;
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

describe('useStreamingText', () => {
  let mockEventSource: MockEventSource | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventSource = null;

    // Mock global EventSource
    (global as any).EventSource = vi.fn().mockImplementation((url: string) => {
      mockEventSource = new MockEventSource(url);
      return mockEventSource;
    });
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useStreamingText());

    expect(result.current.text).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.progress).toBe(0);
  });

  it('should connect and receive streaming data', async () => {
    const { result } = renderHook(() => useStreamingText({ enableBuffering: false }));

    act(() => {
      result.current.subscribe('https://example.com/stream');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('streaming');
    });

    // Simulate incoming tokens
    act(() => {
      mockEventSource?.simulateMessage({ type: 'token', content: 'Hello ' });
    });

    await waitFor(() => {
      expect(result.current.text).toContain('Hello');
    });

    act(() => {
      mockEventSource?.simulateMessage({ type: 'token', content: 'World' });
    });

    await waitFor(() => {
      expect(result.current.text).toContain('World');
    });

    // Complete stream
    act(() => {
      mockEventSource?.simulateMessage({ type: 'complete' });
    });

    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.progress).toBe(100);
    });
  });

  it('should handle streaming errors', async () => {
    const { result } = renderHook(() => useStreamingText({ autoReconnect: false }));

    act(() => {
      result.current.subscribe('https://example.com/stream');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('streaming');
    });

    act(() => {
      mockEventSource?.simulateError();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).not.toBeNull();
    });
  });

  it('should unsubscribe and clean up', async () => {
    const { result } = renderHook(() => useStreamingText());

    act(() => {
      result.current.subscribe('https://example.com/stream');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('streaming');
    });

    act(() => {
      result.current.unsubscribe();
    });

    expect(mockEventSource?.readyState).toBe(2); // CLOSED
  });

  it('should track token count', async () => {
    const { result } = renderHook(() => useStreamingText({ enableBuffering: false }));

    act(() => {
      result.current.subscribe('https://example.com/stream');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('streaming');
    });

    act(() => {
      mockEventSource?.simulateMessage({ type: 'token', content: 'A' });
      mockEventSource?.simulateMessage({ type: 'token', content: 'B' });
      mockEventSource?.simulateMessage({ type: 'token', content: 'C' });
    });

    await waitFor(() => {
      expect(result.current.tokenCount).toBe(3);
    });
  });
});
