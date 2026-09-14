import React, { useState } from 'react';
import { 
  Search, 
  Zap, 
  Bot, 
  GitBranch, 
  Send, 
  Webhook, 
  Clock, 
  Mail, 
  Sparkles, 
  BrainCircuit, 
  Layers, 
  Globe, 
  FileSearch, 
  Split, 
  Filter, 
  Hourglass, 
  MessageSquare, 
  Network, 
  Database,
  Repeat,
  Target,
  Radio
} from 'lucide-react';
import { NODE_CATEGORIES, NODE_DEFINITIONS } from '../data/nodeDefinitions';

const ICON_MAP = {
  Zap,
  Bot,
  GitBranch,
  Send,
  Webhook,
  Clock,
  Mail,
  Sparkles,
  BrainCircuit,
  Layers,
  Globe,
  FileSearch,
  Split,
  Filter,
  Hourglass,
  MessageSquare,
  Network,
  Database,
  Repeat,
  Target,
  Radio
};

export default function Sidebar({ onAddNode }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = NODE_DEFINITIONS.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (e, nodeDef) => {
    e.dataTransfer.setData('application/autoflow-node', JSON.stringify(nodeDef));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <aside className="catalog-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">Node Catalog</div>
        <div className="search-box">
          <Search size={14} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search Ralph loop, Claude, RabbitMQ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="catalog-scroll">
        {Object.entries(NODE_CATEGORIES).map(([catKey, catMeta]) => {
          const nodesInCat = filteredNodes.filter(n => n.category === catKey);
          if (nodesInCat.length === 0) return null;

          const CategoryIcon = ICON_MAP[catMeta.icon] || Zap;

          return (
            <div key={catKey} className="category-group">
              <div className="category-label-row">
                <span className="category-label">
                  <CategoryIcon size={14} style={{ color: catMeta.color }} />
                  {catMeta.label}
                </span>
                <span 
                  className="category-badge"
                  style={{ 
                    background: catMeta.glowColor, 
                    color: catMeta.color,
                    border: `1px solid ${catMeta.borderColor}`
                  }}
                >
                  {catMeta.badge}
                </span>
              </div>

              {nodesInCat.map(nodeDef => {
                const NodeIcon = ICON_MAP[nodeDef.icon] || Bot;
                return (
                  <div 
                    key={nodeDef.type}
                    className="node-item-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeDef)}
                    onClick={() => onAddNode(nodeDef)}
                    title="Click or drag onto canvas to add"
                  >
                    <div 
                      className="node-item-icon"
                      style={{ 
                        background: catMeta.bgGradient,
                        color: catMeta.color,
                        border: `1px solid ${catMeta.borderColor}`
                      }}
                    >
                      <NodeIcon size={16} />
                    </div>
                    <div className="node-item-details">
                      <div className="node-item-name">{nodeDef.name}</div>
                      <div className="node-item-desc">{nodeDef.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
