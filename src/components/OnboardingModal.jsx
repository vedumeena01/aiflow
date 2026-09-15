import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X, 
  Layers, 
  Repeat, 
  ShieldCheck, 
  Code2, 
  Play, 
  Bot,
  Zap
} from 'lucide-react';
import { markOnboardingCompleted } from '../services/feedbackService';

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'STEP 1 OF 4',
    title: 'Visual Multi-Agent Canvas',
    tagline: 'Orchestrate distributed AI systems with zero code or export to LangGraph',
    icon: Layers,
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15))',
    points: [
      'Topological Bezier Wiring: Connect triggers, LLMs, and logic gates with drag-and-drop ease.',
      'Kahn\'s DAG Validation: Built-in algorithm blocks circular execution loops in real-time.',
      'Multi-Model Inference: Claude 3.5 Sonnet, Gemini 1.5 Pro, Groq Llama 3.3, and OpenAI.'
    ]
  },
  {
    step: 2,
    badge: 'STEP 2 OF 4',
    title: 'Ralph Autonomous Self-Correction',
    tagline: 'Gated feedback loops that critique reasoning until strict criteria pass',
    icon: Repeat,
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
    points: [
      'Self-Evaluating Critique: Ralph evaluates intermediate outputs against custom SLA metrics.',
      'Bounded Iterations: Configurable maximum retry limit prevents runaway compute bills.',
      'Auto-Refinement: Automatically regenerates payloads when confidence or quality scores fall below threshold.'
    ]
  },
  {
    step: 3,
    badge: 'STEP 3 OF 4',
    title: 'HITL Safety Gates & Code Sandbox',
    tagline: 'Maintain human oversight and run live JavaScript transformations in-browser',
    icon: ShieldCheck,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))',
    points: [
      'Human-in-the-Loop Gates: Pause pipelines before high-risk actions (refunds, database writes, AMQP dispatch).',
      'Execution Breakpoints: Step-by-step state inspection with time-travel replay scrubbing.',
      'V8 Code Sandbox: In-browser script execution with pre-bundled presets (JSON normalizer, PII redactor).'
    ]
  },
  {
    step: 4,
    badge: 'STEP 4 OF 4',
    title: 'Enterprise Vault & 1-Click LangGraph',
    tagline: 'Save work locally, auto-save drafts, and export production code',
    icon: Code2,
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(3, 105, 161, 0.15))',
    points: [
      'Persistent Workflow Vault: Named pipeline versions, tags, and auto-save draft recovery (Ctrl+S).',
      '1-Click Python LangGraph: Generates production StateGraph code ready for FastAPI deployment.',
      'Portable .autoflow.json Packages: Share pipeline topologies across teams with verified schema checking.'
    ]
  }
];

export default function OnboardingModal({
  isOpen,
  onClose,
  onLoadSampleWorkflow
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const IconComponent = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    if (dontShowAgain) {
      markOnboardingCompleted();
    }
    onClose();
  };

  const handleGetStartedWithSample = () => {
    handleFinish();
    onLoadSampleWorkflow?.();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 620,
          width: '95%',
          background: 'rgba(13, 17, 23, 0.98)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(99, 102, 241, 0.2)',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Top Header Banner */}
        <div 
          style={{
            padding: '24px 28px',
            background: current.gradient,
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div 
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${current.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: current.color,
                boxShadow: `0 0 20px ${current.color}40`
              }}
            >
              <IconComponent size={22} />
            </div>
            <div>
              <span 
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: current.color,
                  textTransform: 'uppercase'
                }}
              >
                {current.badge}
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', margin: '3px 0 0 0' }}>
                {current.title}
              </h2>
            </div>
          </div>

          <button 
            className="btn btn-ghost" 
            onClick={handleFinish}
            style={{ padding: '6px 8px', color: '#94a3b8' }}
            title="Close Tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Content */}
        <div style={{ padding: '24px 28px' }}>
          <p style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 18px 0', lineHeight: 1.5, fontWeight: 500 }}>
            {current.tagline}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {current.points.map((pt, idx) => (
              <div 
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  padding: '12px 14px'
                }}
              >
                <div 
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: `${current.color}20`,
                    color: current.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                    flexShrink: 0
                  }}
                >
                  <Check size={12} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.45 }}>
                  {pt}
                </span>
              </div>
            ))}
          </div>

          {/* Step Progress Indicators */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {TOUR_STEPS.map((s, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? 28 : 8,
                  height: 6,
                  borderRadius: 3,
                  background: idx === currentStep ? current.color : 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              />
            ))}
          </div>

          {/* Footer Controls */}
          <div 
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: 18
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}>
              <input 
                type="checkbox"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
              />
              <span>Don't show tour on startup</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              {currentStep > 0 && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  style={{ fontSize: 12 }}
                >
                  <ArrowLeft size={14} />
                  <span>Previous</span>
                </button>
              )}

              {isLast ? (
                <button
                  className="btn btn-primary"
                  onClick={handleGetStartedWithSample}
                  style={{
                    fontSize: 13,
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Play size={13} fill="white" />
                  <span>Start Building with Ralph Loop</span>
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  style={{
                    fontSize: 13,
                    padding: '8px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Next Feature</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
