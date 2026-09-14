import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  Coins, 
  Loader2,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';

export default function ChatPlayground({
  isOpen,
  onClose,
  workflowName,
  executionMode,
  onSendChatMessage,
  isProcessing
}) {
  if (!isOpen) return null;

  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      role: 'assistant',
      content: `Hello! I am your autonomous agent pipeline for **${workflowName}**. Send me an inquiry or task, and I will route it through your canvas nodes in real time.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      nodesTraversed: ['Pipeline Ready'],
      latency: '0ms',
      tokens: 0
    }
  ]);

  const [inputVal, setInputVal] = useState('');
  const [expandedTraceIds, setExpandedTraceIds] = useState(new Set());
  const chatBottomRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = inputVal.trim();
    if (!query || isProcessing) return;

    const userMsg = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Trigger pipeline execution
    try {
      const result = await onSendChatMessage(query);
      const assistantMsg = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: result.responseText || (typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload, null, 2)),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nodesTraversed: result.nodesTraversed || [],
        latency: result.latency || '1.2s',
        tokens: result.tokens || 420
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Execution error: ${err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleTrace = (msgId) => {
    setExpandedTraceIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Chat cleared. Ready for your next query on **${workflowName}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        nodesTraversed: ['Pipeline Ready'],
        latency: '0ms',
        tokens: 0
      }
    ]);
  };

  // Quick preset query chips based on active workflow
  const presetChips = [
    "Verify payment error 502 discrepancy",
    "Qualify inbound demo request for NovaPulse",
    "Analyze enterprise SLA violation risks"
  ];

  return (
    <aside 
      className="chat-playground-drawer"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '95vw',
        background: 'rgba(10, 14, 23, 0.98)',
        backdropFilter: 'blur(16px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 35,
        boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.7)',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Header */}
      <div 
        style={{
          height: '56px',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.95)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div 
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MessageSquare size={16} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Agent Playground</span>
              <span 
                style={{ 
                  fontSize: 9.5, 
                  fontWeight: 700, 
                  padding: '1px 6px', 
                  borderRadius: 4, 
                  background: executionMode === 'live' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: executionMode === 'live' ? '#34d399' : '#a5b4fc',
                  border: executionMode === 'live' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(99, 102, 241, 0.4)'
                }}
              >
                {executionMode === 'live' ? 'LIVE AI' : 'SIMULATED'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              {workflowName}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button 
            className="node-mini-btn" 
            title="Clear Chat History"
            onClick={handleClearChat}
          >
            <Trash2 size={14} />
          </button>
          <button 
            className="node-mini-btn" 
            title="Close Playground"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Preset Chips */}
      <div 
        style={{ 
          padding: '10px 14px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex', 
          gap: 6, 
          overflowX: 'auto',
          background: 'rgba(255, 255, 255, 0.02)'
        }}
      >
        {presetChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => setInputVal(chip)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 100,
              padding: '4px 10px',
              fontSize: 10.5,
              color: '#cbd5e1',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            + {chip}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {messages.map(msg => (
          <div 
            key={msg.id}
            style={{
              display: 'flex',
              gap: 10,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-start'
            }}
          >
            {/* Avatar */}
            <div 
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: msg.role === 'user' ? '#3b82f6' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: '#ffffff'
              }}
            >
              {msg.role === 'user' ? <User size={14} /> : <Bot size={15} />}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div 
                style={{
                  background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '10px 14px',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  color: '#f8fafc',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {msg.content}
              </div>

              {/* Collapsible Pipeline Execution Trace (Assistant Only) */}
              {msg.nodesTraversed && msg.nodesTraversed.length > 0 && (
                <div style={{ marginTop: 2 }}>
                  <button
                    onClick={() => toggleTrace(msg.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#818cf8',
                      fontSize: 11,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      padding: '2px 0'
                    }}
                  >
                    {expandedTraceIds.has(msg.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span>Pipeline Reasoning Trace ({msg.nodesTraversed.length} nodes)</span>
                  </button>

                  {expandedTraceIds.has(msg.id) && (
                    <div 
                      style={{
                        marginTop: 4,
                        background: '#04070e',
                        border: '1px solid rgba(255, 255, 255, 0.07)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      <div style={{ color: '#94a3b8', marginBottom: 4 }}>Traversal Order:</div>
                      {msg.nodesTraversed.map((nodeTitle, idx) => (
                        <div key={idx} style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#64748b' }}>{idx + 1}.</span>
                          <span>{nodeTitle}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Telemetry pill row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: '#64748b', padding: '0 2px' }}>
                <span>{msg.timestamp}</span>
                {msg.latency && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={10} /> {msg.latency}
                  </span>
                )}
                {msg.tokens > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Coins size={10} /> {msg.tokens} tokens
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div 
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}
            >
              <Loader2 size={14} className="spin-animate" />
            </div>
            <div 
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px 12px 12px 2px',
                padding: '8px 14px',
                fontSize: 12,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span className="pulsing-dot" />
              <span>Agents executing across canvas nodes...</span>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSend}
        style={{
          padding: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.98)',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end'
        }}
      >
        <textarea
          rows={2}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your agent pipeline a question... (Enter to send)"
          disabled={isProcessing}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 12.5,
            color: '#ffffff',
            resize: 'none',
            fontFamily: 'var(--font-sans)',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={!inputVal.trim() || isProcessing}
          className="btn btn-primary"
          style={{
            height: '42px',
            padding: '0 16px',
            borderRadius: 8,
            opacity: !inputVal.trim() || isProcessing ? 0.5 : 1
          }}
        >
          {isProcessing ? <Loader2 size={16} className="spin-animate" /> : <Send size={16} />}
        </button>
      </form>
    </aside>
  );
}
