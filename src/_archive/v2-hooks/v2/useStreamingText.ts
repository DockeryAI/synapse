/**
 * useStreamingText Hook
 *
 * Subscribe to and display streaming text updates with smooth character-by-character display.
 * Manages EventSource connections, buffering, and reconnection logic.
 *
 * ISOLATION: Zero V1 imports - Uses V2 services only
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Streaming status
 */
export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'complete' | 'error';

/**
 * Hook options
 */
export interface UseStreamingTextOptions {
  /** Enable automatic reconnection on connection drop */
  autoReconnect?: boolean;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
  /** Character display interval in ms (for smooth typing effect) */
  characterInterval?: number;
  /** Enable buffering for smooth display */
  enableBuffering?: boolean;
}

/**
 * Hook return value
 */
export interface UseStreamingTextReturn {
  /** Accumulated text */
  text: string;
  /** Is currently streaming */
  isStreaming: boolean;
  /** Streaming status */
  status: StreamingStatus;
  /** Estimated progress (0-100) */
  progress: number;
  /** Subscribe to stream URL */
  subscribe: (streamUrl: string) => void;
  /** Unsubscribe and clean up */
  unsubscribe: () => void;
  /** Error if connection failed */
  error: Error | null;
  /** Number of tokens received */
  tokenCount: number;
}

/**
 * useStreamingText Hook
 *
 * Manages streaming text connections with automatic buffering and reconnection.
 * Provides smooth character-by-character display effect.
 *
 * @example
 * ```tsx
 * function StreamingDisplay({ streamUrl }: { streamUrl: string }) {
 *   const { text, isStreaming, progress, subscribe } = useStreamingText();
 *
 *   useEffect(() => {
 *     subscribe(streamUrl);
 *   }, [streamUrl, subscribe]);
 *
 *   return (
 *     <div>
 *       {isStreaming && <ProgressBar value={progress} />}
 *       <p>{text}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useStreamingText(
  options: UseStreamingTextOptions = {}
): UseStreamingTextReturn {
  const {
    autoReconnect = true,
    maxReconnectAttempts = 3,
    characterInterval = 30,
    enableBuffering = true,
  } = options;

  // State
  const [text, setText] = useState('');
  const [status, setStatus] = useState<StreamingStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [progress, setProgress] = useState(0);

  // Refs
  const eventSourceRef = useRef<EventSource | null>(null);
  const bufferRef = useRef<string>('');
  const displayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const currentUrlRef = useRef<string | null>(null);

  /**
   * Process buffered text character by character
   */
  const processBuffer = useCallback(() => {
    if (bufferRef.current.length === 0) {
      if (displayIntervalRef.current) {
        clearInterval(displayIntervalRef.current);
        displayIntervalRef.current = null;
      }
      return;
    }

    setText((prev) => {
      const nextChar = bufferRef.current[0];
      bufferRef.current = bufferRef.current.slice(1);

      // Update progress based on buffer state
      if (status === 'streaming') {
        const estimatedTotal = prev.length + bufferRef.current.length + 100;
        setProgress(Math.min(95, (prev.length / estimatedTotal) * 100));
      }

      return prev + nextChar;
    });
  }, [status]);

  /**
   * Start character display interval
   */
  const startDisplayInterval = useCallback(() => {
    if (!enableBuffering) return;
    if (displayIntervalRef.current) return;

    displayIntervalRef.current = setInterval(processBuffer, characterInterval);
  }, [characterInterval, enableBuffering, processBuffer]);

  /**
   * Stop character display interval
   */
  const stopDisplayInterval = useCallback(() => {
    if (displayIntervalRef.current) {
      clearInterval(displayIntervalRef.current);
      displayIntervalRef.current = null;
    }
  }, []);

  /**
   * Handle incoming stream data
   */
  const handleStreamData = useCallback(
    (data: string) => {
      if (enableBuffering) {
        // Add to buffer for smooth display
        bufferRef.current += data;
        startDisplayInterval();
      } else {
        // Display immediately
        setText((prev) => prev + data);
      }

      setTokenCount((prev) => prev + 1);
    },
    [enableBuffering, startDisplayInterval]
  );

  /**
   * Subscribe to stream URL
   */
  const subscribe = useCallback(
    (streamUrl: string) => {
      // Unsubscribe from any existing connection
      unsubscribe();

      // Reset state
      setText('');
      setError(null);
      setTokenCount(0);
      setProgress(0);
      bufferRef.current = '';
      reconnectAttemptsRef.current = 0;
      currentUrlRef.current = streamUrl;

      setStatus('connecting');

      try {
        // Create EventSource connection
        const eventSource = new EventSource(streamUrl);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setStatus('streaming');
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // Handle different message types
            if (data.type === 'token') {
              handleStreamData(data.content);
            } else if (data.type === 'complete') {
              setStatus('complete');
              setProgress(100);

              // Flush remaining buffer
              if (bufferRef.current.length > 0) {
                setText((prev) => prev + bufferRef.current);
                bufferRef.current = '';
              }

              stopDisplayInterval();
              eventSource.close();
            } else if (data.type === 'error') {
              const streamError = new Error(data.message || 'Stream error');
              setError(streamError);
              setStatus('error');
              stopDisplayInterval();
              eventSource.close();
            }
          } catch (parseError) {
            console.warn('Failed to parse stream message:', parseError);
            // Try to display raw data
            handleStreamData(event.data);
          }
        };

        eventSource.onerror = () => {
          setStatus('error');

          // Attempt reconnection
          if (
            autoReconnect &&
            reconnectAttemptsRef.current < maxReconnectAttempts &&
            currentUrlRef.current
          ) {
            reconnectAttemptsRef.current++;
            console.log(
              `Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`
            );

            // Exponential backoff
            const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 10000);
            setTimeout(() => {
              if (currentUrlRef.current) {
                subscribe(currentUrlRef.current);
              }
            }, delay);
          } else {
            const connectionError = new Error('Stream connection failed');
            setError(connectionError);
            stopDisplayInterval();
          }

          eventSource.close();
        };
      } catch (initError) {
        const err = initError instanceof Error ? initError : new Error(String(initError));
        setError(err);
        setStatus('error');
      }
    },
    [autoReconnect, maxReconnectAttempts, handleStreamData, stopDisplayInterval]
  );

  /**
   * Unsubscribe and clean up
   */
  const unsubscribe = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    stopDisplayInterval();
    currentUrlRef.current = null;

    // Flush any remaining buffer
    if (bufferRef.current.length > 0) {
      setText((prev) => prev + bufferRef.current);
      bufferRef.current = '';
    }

    if (status !== 'complete') {
      setStatus('idle');
    }
  }, [status, stopDisplayInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    text,
    isStreaming: status === 'streaming',
    status,
    progress,
    subscribe,
    unsubscribe,
    error,
    tokenCount,
  };
}
