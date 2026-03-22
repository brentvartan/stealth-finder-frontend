import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { chat as chatApi } from '../api/client';
import { Send, Sparkles, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  "What are the top HOT signals right now?",
  "Find all longevity or healthspan brands",
  "Which brands have known founders?",
  "What's the strongest thesis you see in the database?",
  "Show me GenAlpha Beauty signals",
  "Any functional beverage brands worth watching?",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: isUser ? '#052EF0' : '#000' }}
      >
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Sparkles className="w-3.5 h-3.5 text-white" />
        }
      </div>
      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'text-white' : 'text-neutral-800'
        }`}
        style={{
          backgroundColor: isUser ? '#052EF0' : '#fff',
          border: isUser ? 'none' : '1px solid #E5E5E0',
        }}
      >
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-black">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const location               = useLocation();
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState(location.state?.prefill || '');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    setInput('');
    setError('');
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await chatApi.ask(newMessages);
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-7 flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>

      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#000' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl uppercase tracking-wide text-black leading-none">
              Ask Finder
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              AI analyst over your signal database
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1">

        {isEmpty && (
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <p className="text-sm text-neutral-400 leading-relaxed">
                Ask anything about the signals in your database — patterns, themes,
                specific brands, or investment thesis analysis.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-left px-4 py-3 rounded-lg text-sm text-neutral-600 transition-all hover:shadow-sm"
                  style={{ backgroundColor: '#fff', border: '1px solid #E5E5E0' }}
                >
                  <span className="text-neutral-300 mr-2">→</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && <TypingIndicator />}

        {error && (
          <div className="text-xs text-red-500 text-center">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="shrink-0 pt-3" style={{ borderTop: '1px solid #E5E5E0' }}>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-[10px] text-neutral-300 hover:text-neutral-500 transition-colors mb-2 font-medium uppercase tracking-wider"
          >
            Clear conversation
          </button>
        )}
        <div
          className="flex items-end gap-2 bg-white rounded-xl px-4 py-3"
          style={{ border: '1px solid #E5E5E0' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your signals... (Enter to send)"
            className="flex-1 text-sm resize-none focus:outline-none placeholder-neutral-300 leading-relaxed"
            rows={1}
            style={{ maxHeight: '120px' }}
            onInput={e => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all shrink-0"
            style={{
              backgroundColor: (!input.trim() || loading) ? '#EEE' : '#052EF0',
              color: (!input.trim() || loading) ? '#CCC' : '#fff',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-300 mt-1.5 text-center">
          Answers are grounded in your signal database only
        </p>
      </div>
    </div>
  );
}
