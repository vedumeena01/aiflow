import React, { useState, useMemo } from 'react';
import { 
  Cloud, 
  Download, 
  Copy, 
  Check, 
  X, 
  Terminal, 
  FileCode, 
  Boxes, 
  ShieldCheck, 
  ExternalLink,
  Rocket
} from 'lucide-react';
import { generateCloudDeploymentPackage, downloadCloudDeploymentZip } from '../services/cloudDeployService';

export default function CloudDeployModal({
  isOpen,
  onClose,
  workflowName,
  nodes,
  connections,
  onNotification
}) {
  const [selectedFile, setSelectedFile] = useState('Dockerfile');
  const [copiedFile, setCopiedFile] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Generate deployment package
  const deploymentPackage = useMemo(() => {
    if (!isOpen) return { packageName: 'agent', files: {} };
    return generateCloudDeploymentPackage(workflowName, nodes, connections);
  }, [isOpen, workflowName, nodes, connections]);

  if (!isOpen) return null;

  const currentContent = deploymentPackage.files[selectedFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadCloudDeploymentZip(deploymentPackage.packageName, deploymentPackage.files);
      onNotification?.(`Downloaded ${deploymentPackage.packageName}-cloud-package.zip`);
    } catch (e) {
      alert(`ZIP creation failed: ${e.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  const filesList = Object.keys(deploymentPackage.files);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 960,
          width: '95%',
          maxHeight: '90vh',
          background: 'rgba(13, 17, 23, 0.98)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          borderRadius: 16,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.2)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.15) 0%, transparent 100%)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div 
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.2))',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
              }}
            >
              <Rocket size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                  Cloud & Docker Deployment Packager
                </h3>
                <span 
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  FASTAPI + LANGGRAPH
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                Production-ready container suite with health checks, background task queues, and multi-cloud guides.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              className="btn btn-primary"
              disabled={isZipping}
              onClick={handleDownloadZip}
              style={{
                fontSize: 12,
                padding: '7px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid #38bdf8'
              }}
            >
              <Download size={14} />
              <span>{isZipping ? 'Archiving...' : 'Download Full Package (.zip)'}</span>
            </button>

            <button 
              className="btn btn-ghost" 
              onClick={onClose}
              style={{ padding: '6px 8px', color: '#94a3b8' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* File Tabs Toolbar */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.3)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '0 20px',
            overflowX: 'auto'
          }}
        >
          <div style={{ display: 'flex', gap: 4 }}>
            {filesList.map(filename => (
              <button
                key={filename}
                onClick={() => setSelectedFile(filename)}
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Consolas, Monaco, monospace',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: selectedFile === filename ? '2px solid #38bdf8' : '2px solid transparent',
                  color: selectedFile === filename ? '#38bdf8' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <FileCode size={13} />
                <span>{filename}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="btn btn-ghost"
            style={{
              padding: '4px 10px',
              fontSize: 11,
              color: copiedFile ? '#34d399' : '#cbd5e1'
            }}
          >
            {copiedFile ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedFile ? 'Copied' : 'Copy File'}</span>
          </button>
        </div>

        {/* Code View Area */}
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', background: '#070b12' }}>
          <pre
            style={{
              margin: 0,
              padding: '14px 16px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: 12,
              lineHeight: 1.5,
              color: '#e2e8f0',
              overflowX: 'auto',
              whiteSpace: 'pre'
            }}
          >
            {currentContent}
          </pre>
        </div>

        {/* Cloud Quick Deploy Footer Bar */}
        <div 
          style={{
            padding: '14px 20px',
            background: 'rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <Terminal size={14} style={{ color: '#38bdf8' }} />
            <span>Quick Deploy:</span>
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: '#38bdf8', fontSize: 11 }}>
              docker compose up --build -d
            </code>
            <span>or</span>
            <code style={{ background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4, color: '#a5b4fc', fontSize: 11 }}>
              gcloud run deploy --source .
            </code>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={13} /> Non-root Docker user & curl health check included
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
