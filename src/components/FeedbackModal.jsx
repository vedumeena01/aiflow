import React, { useState, useMemo } from 'react';
import { 
  MessageSquarePlus, 
  Star, 
  Bug, 
  Lightbulb, 
  Check, 
  X, 
  BarChart3, 
  Cpu, 
  Send,
  AlertCircle
} from 'lucide-react';
import { submitUserFeedback, getStoredFeedback, getTelemetrySummary } from '../services/feedbackService';

export default function FeedbackModal({
  isOpen,
  onClose,
  currentDiagnostics = {},
  onNotification
}) {
  const [activeTab, setActiveTab] = useState('rating'); // 'rating' | 'bug' | 'feature' | 'analytics'
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Stored feedback list
  const storedList = useMemo(() => getStoredFeedback(), [isSubmitted]);
  const telemetrySummary = useMemo(() => getTelemetrySummary(), [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      submitUserFeedback({
        type: activeTab,
        rating,
        title: title || (activeTab === 'rating' ? `${rating}-Star Experience Rating` : 'Feedback Submission'),
        description,
        category,
        diagnostics: currentDiagnostics
      });

      setIsSubmitting(false);
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setTitle('');
        setDescription('');
        onClose();
      }, 1200);

      onNotification?.('Thank you! Your feedback has been recorded in the platform telemetry.');
    } catch (err) {
      alert(`Submission error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 640,
          width: '95%',
          background: 'rgba(13, 17, 23, 0.98)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.15)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, transparent 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}
            >
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                User Feedback & Experience Portal
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Help shape AutoFlow AI. Your input directly drives upcoming sprint releases.
              </p>
            </div>
          </div>

          <button 
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: '6px 8px', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div 
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0 24px',
            gap: 8
          }}
        >
          <button
            onClick={() => setActiveTab('rating')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'rating' ? '2px solid #fbbf24' : '2px solid transparent',
              color: activeTab === 'rating' ? '#fbbf24' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Star size={14} />
            <span>Product Rating</span>
          </button>

          <button
            onClick={() => setActiveTab('bug')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'bug' ? '2px solid #ef4444' : '2px solid transparent',
              color: activeTab === 'bug' ? '#f87171' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Bug size={14} />
            <span>Report Bug</span>
          </button>

          <button
            onClick={() => setActiveTab('feature')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'feature' ? '2px solid #818cf8' : '2px solid transparent',
              color: activeTab === 'feature' ? '#818cf8' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Lightbulb size={14} />
            <span>Request Feature</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            style={{
              padding: '12px 14px',
              fontSize: 12,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'analytics' ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === 'analytics' ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <BarChart3 size={14} />
            <span>Telemetry Summary</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, maxHeight: '65vh', overflowY: 'auto' }}>
          {/* TAB: RATING */}
          {activeTab === 'rating' && (
            <form onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', margin: '8px 0 20px 0' }}>
                <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 12px 0' }}>
                  How satisfied are you with AutoFlow AI's multi-agent workflow studio?
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating || rating) >= star ? 'scale(1.2)' : 'scale(1)'
                      }}
                    >
                      <Star 
                        size={28} 
                        fill={(hoverRating || rating) >= star ? '#fbbf24' : 'none'}
                        color={(hoverRating || rating) >= star ? '#fbbf24' : '#64748b'}
                      />
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 8, fontWeight: 600 }}>
                  {rating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (Exceeds Expectations)' : 
                   rating === 4 ? '⭐⭐⭐⭐ Great (Production Ready)' : 
                   rating === 3 ? '⭐⭐⭐ Good (Needs Polish)' : 
                   rating === 2 ? '⭐⭐ Room for Improvement' : '⭐ Critical Issues Encountered'}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  What worked well or what can we improve?
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Share details about your experience with canvas navigation, LLM execution, or code export..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || isSubmitted}
                  className="btn btn-primary"
                  style={{ background: isSubmitted ? '#10b981' : undefined }}
                >
                  {isSubmitted ? (
                    <>
                      <Check size={14} />
                      <span>Feedback Received!</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit Rating'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: BUG REPORT */}
          {activeTab === 'bug' && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Bug Summary *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Infinite canvas wire doesn't snap to port at 150% zoom"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Steps to Reproduce / Expected Behavior
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what happened and how to recreate the issue..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Diagnostic State Telemetry Preview */}
              <div 
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 18,
                  fontSize: 11
                }}
              >
                <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={13} />
                  <span>Auto-Captured Environment Diagnostics:</span>
                </div>
                <div style={{ color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.4 }}>
                  • Nodes on Canvas: {currentDiagnostics.nodeCount ?? 0} | Wires: {currentDiagnostics.connectionCount ?? 0}<br />
                  • Active Mode: {currentDiagnostics.executionMode ?? 'Simulation'}<br />
                  • Browser Viewport: {window.innerWidth} x {window.innerHeight}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || isSubmitted}
                  className="btn btn-primary"
                  style={{ background: isSubmitted ? '#10b981' : '#ef4444' }}
                >
                  {isSubmitted ? (
                    <>
                      <Check size={14} />
                      <span>Bug Logged!</span>
                    </>
                  ) : (
                    <>
                      <Bug size={14} />
                      <span>Submit Bug Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: FEATURE REQUEST */}
          {activeTab === 'feature' && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Feature Category
                </label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="models">New AI Models (DeepSeek, Cohere, Local Ollama)</option>
                  <option value="integrations">Third-Party Integrations (Slack, Jira, GitHub, Notion)</option>
                  <option value="nodes">New Node Types (SQL Connector, GraphQL, PDF OCR)</option>
                  <option value="canvas">Canvas & Visual UX (Subgraphs, Custom Themes)</option>
                  <option value="cloud">Cloud Deployment & Hosting</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Proposed Feature Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Local Ollama node for offline zero-cost inference"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#cbd5e1', marginBottom: 6 }}>
                  Business Use Case & Value
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="How would this feature help your multi-agent architecture or enterprise client workflows?"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    color: '#f8fafc',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || isSubmitted}
                  className="btn btn-primary"
                  style={{ background: isSubmitted ? '#10b981' : undefined }}
                >
                  {isSubmitted ? (
                    <>
                      <Check size={14} />
                      <span>Idea Submitted!</span>
                    </>
                  ) : (
                    <>
                      <Lightbulb size={14} />
                      <span>Submit Feature Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB: TELEMETRY SUMMARY */}
          {activeTab === 'analytics' && (
            <div>
              <div 
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginBottom: 20
                }}
              >
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#818cf8' }}>
                    {telemetrySummary.totalEvents}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Recorded Events</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399' }}>
                    {storedList.filter(f => f.type === 'rating').length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>User Ratings</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: 14, borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>
                    {storedList.filter(f => f.type === 'bug').length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Logged Bugs</div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 10px 0' }}>
                Recent User Feedback & Submissions
              </h4>

              {storedList.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  No feedback submissions recorded yet. Rate or submit an idea above!
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {storedList.slice(0, 5).map(f => (
                    <div 
                      key={f.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        padding: 12
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>{f.title}</span>
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(f.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
                        {f.description || `Rating: ${f.rating}/5 stars`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
