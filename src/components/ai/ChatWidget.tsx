/**
 * AI Chat Widget
 * Bottom-right floating chat widget with Claude Sonnet 4.5
 *
 * Features:
 * - Expandable chat panel (mobile-responsive)
 * - Text input + voice input
 * - Conversation history
 * - Real-time streaming responses
 * - Business context awareness
 * - Persistent storage
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Mic,
  MicOff,
  Loader,
  AlertCircle,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  ChatMessage,
  ChatWidgetConfig,
  ChatWidgetState,
  ConversationContext,
  AIBusinessContext,
} from '../../types/ai.types';
import { ClaudeAIService } from '../../services/ai/ClaudeAIService';
import { ConversationStorageService } from '../../services/ai/ConversationStorageService';

interface ChatWidgetProps {
  apiKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  userId: string;
  businessContext?: AIBusinessContext;
  config?: Partial<ChatWidgetConfig>;
  onMessage?: (message: ChatMessage) => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  apiKey,
  supabaseUrl,
  supabaseKey,
  userId,
  businessContext,
  config = {},
  onMessage,
}) => {
  // Services
  const aiService = useRef(new ClaudeAIService({
    apiKey,
    model: 'claude-sonnet-4-5-20250929'
  }));
  const storageService = useRef(
    new ConversationStorageService(supabaseUrl, supabaseKey)
  );

  // State
  const [state, setState] = useState<ChatWidgetState>({
    isOpen: false,
    isLoading: false,
    isRecording: false,
    unreadCount: 0,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Config with defaults
  const widgetConfig: ChatWidgetConfig = {
    position: 'bottom-right',
    theme: 'light',
    showVoiceInput: true,
    showHistory: true,
    maxHeight: 600,
    placeholder: 'Ask me anything about your marketing...',
    ...config,
  };

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Focus input when opened
  useEffect(() => {
    if (state.isOpen) {
      inputRef.current?.focus();
    }
  }, [state.isOpen]);

  /**
   * Load or create conversation
   */
  const loadConversation = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    const context: ConversationContext = {
      currentPage: window.location.pathname,
    };

    const result = await storageService.current.getCurrentConversation(userId, context);

    if (result.success && result.data) {
      setConversationId(result.data.id);
      setMessages(result.data.messages);
    } else {
      console.error('Failed to load conversation:', result.error);
      setState((prev) => ({ ...prev, error: result.error }));
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  };

  /**
   * Send message
   */
  const sendMessage = async (content: string, isVoice = false) => {
    if (!content.trim() || !conversationId) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      metadata: { voiceInput: isVoice },
    };

    // Add user message
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setState((prev) => ({ ...prev, isLoading: true }));

    // Store user message
    await storageService.current.addMessage(conversationId, userMessage);

    // Get AI response (streaming)
    try {
      let fullResponse = '';
      setStreamingMessage('');

      const stream = aiService.current.chatStream({
        message: content,
        conversationHistory: messages,
        context: {
          currentPage: window.location.pathname,
        },
      });

      for await (const chunk of stream) {
        if (!chunk.complete) {
          fullResponse += chunk.delta;
          setStreamingMessage(fullResponse);
        } else {
          // Final message
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
            metadata: {
              model: 'claude-sonnet-4-5-20250929',
            },
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingMessage('');

          // Store assistant message
          await storageService.current.addMessage(conversationId, assistantMessage);

          if (onMessage) {
            onMessage(assistantMessage);
          }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get response',
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Handle voice input
   */
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setState((prev) => ({
        ...prev,
        error: 'Voice input not supported in this browser',
      }));
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, isRecording: true }));
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');

      setInputValue(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        error: `Voice input error: ${event.error}`,
      }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, isRecording: false }));

      // Auto-send if we have content
      if (inputValue.trim()) {
        sendMessage(inputValue, true);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  /**
   * Clear conversation
   */
  const clearConversation = async () => {
    if (!confirm('Clear this conversation? This cannot be undone.')) return;

    if (conversationId) {
      await storageService.current.deleteConversation(conversationId);
    }

    setMessages([]);
    loadConversation();
  };

  /**
   * Toggle widget
   */
  const toggleWidget = () => {
    setState((prev) => ({
      ...prev,
      isOpen: !prev.isOpen,
      unreadCount: prev.isOpen ? prev.unreadCount : 0,
    }));
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[widgetConfig.position!]} z-50`}>
      {/* Chat Panel */}
      {state.isOpen && (
        <div
          className="mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{
            width: window.innerWidth < 640 ? '90vw' : '400px',
            maxWidth: '400px',
            height: window.innerHeight < 700 ? '70vh' : `${widgetConfig.maxHeight}px`,
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Synapse AI</h3>
                <p className="text-xs opacity-90">Marketing Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearConversation}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={toggleWidget}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && !state.isLoading && (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">
                  Hi! I'm Synapse AI. Ask me anything about your marketing campaigns!
                </p>
                <div className="mt-4 text-xs space-y-1">
                  <p className="font-medium text-gray-700">Try asking:</p>
                  <p>"How's my campaign performing?"</p>
                  <p>"Generate a post for Instagram"</p>
                  <p>"When should I post?"</p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {message.metadata?.voiceInput && ' 🎤'}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white text-gray-800 border border-gray-200">
                  <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                  <p className="text-xs mt-1 text-gray-400">
                    <span className="inline-block animate-pulse">●</span> typing...
                  </p>
                </div>
              </div>
            )}

            {/* Loading */}
            {state.isLoading && !streamingMessage && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl px-4 py-2 border border-gray-200">
                  <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              </div>
            )}

            {/* Error */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-800">{state.error}</p>
                    <button
                      onClick={() => setState((prev) => ({ ...prev, error: undefined }))}
                      className="text-xs text-red-600 hover:text-red-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
                placeholder={widgetConfig.placeholder}
                disabled={state.isLoading || state.isRecording}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-gray-100"
              />

              {widgetConfig.showVoiceInput && (
                <button
                  onClick={state.isRecording ? stopVoiceInput : startVoiceInput}
                  disabled={state.isLoading}
                  className={`p-2 rounded-full transition-colors ${
                    state.isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                  title={state.isRecording ? 'Stop recording' : 'Voice input'}
                >
                  {state.isRecording ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>
              )}

              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || state.isLoading || state.isRecording}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={toggleWidget}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 relative"
        title="Chat with Synapse AI"
      >
        {state.isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {state.unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {state.unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
