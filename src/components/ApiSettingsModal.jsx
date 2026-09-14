import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check, Eye, EyeOff } from 'lucide-react';

export default function ApiSettingsModal({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys
}) {
  if (!isOpen) return null;

  const [keys, setKeys] = useState({
    gemini: apiKeys.gemini || '',
    anthropic: apiKeys.anthropic || '',
    openai: apiKeys.openai || '',
    groq: apiKeys.groq || ''
  });

  const [showGemini, setShowGemini] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveKeys(keys);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Key size={18} style={{ color: '#818cf8' }} />
            <span>Live Inference API Keys (Claude, Gemini, OpenAI, Groq)</span>
          </div>
          <button className="node-mini-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '10px 14px', borderRadius: 8 }}>
            <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: '#a7f3d0' }}>
              Your API keys are stored locally in your browser session and are transmitted directly to the model endpoint (Anthropic, Google, Groq, OpenAI).
            </span>
          </div>

          {/* Anthropic Claude API Key */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Anthropic Claude API Key</label>
              <a 
                href="https://console.anthropic.com/settings/keys" 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                Anthropic Console <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showAnthropic ? "text" : "password"}
                className="form-input"
                placeholder="sk-ant-api..."
                value={keys.anthropic}
                onChange={e => setKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                style={{ paddingRight: 36 }}
              />
              <button 
                type="button"
                className="node-mini-btn"
                style={{ position: 'absolute', right: 8 }}
                onClick={() => setShowAnthropic(!showAnthropic)}
              >
                {showAnthropic ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Google Gemini API Key */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Google Gemini API Key</label>
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                Get Free Gemini Key <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showGemini ? "text" : "password"}
                className="form-input"
                placeholder="AIzaSy..."
                value={keys.gemini}
                onChange={e => setKeys(prev => ({ ...prev, gemini: e.target.value }))}
                style={{ paddingRight: 36 }}
              />
              <button 
                type="button"
                className="node-mini-btn"
                style={{ position: 'absolute', right: 8 }}
                onClick={() => setShowGemini(!showGemini)}
              >
                {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Groq API Key (Fast Llama 3.3) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Groq API Key (Llama 3.3 70B)</label>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                Get Free Groq Key <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showGroq ? "text" : "password"}
                className="form-input"
                placeholder="gsk_..."
                value={keys.groq}
                onChange={e => setKeys(prev => ({ ...prev, groq: e.target.value }))}
                style={{ paddingRight: 36 }}
              />
              <button 
                type="button"
                className="node-mini-btn"
                style={{ position: 'absolute', right: 8 }}
                onClick={() => setShowGroq(!showGroq)}
              >
                {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>OpenAI API Key</label>
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: 11, color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
              >
                OpenAI Dashboard <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showOpenAI ? "text" : "password"}
                className="form-input"
                placeholder="sk-proj-..."
                value={keys.openai}
                onChange={e => setKeys(prev => ({ ...prev, openai: e.target.value }))}
                style={{ paddingRight: 36 }}
              />
              <button 
                type="button"
                className="node-mini-btn"
                style={{ position: 'absolute', right: 8 }}
                onClick={() => setShowOpenAI(!showOpenAI)}
              >
                {showOpenAI ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            style={savedSuccess ? { background: '#10b981' } : {}}
          >
            {savedSuccess ? (
              <>
                <Check size={14} />
                <span>Keys Saved!</span>
              </>
            ) : (
              <span>Save & Enable Live AI</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
