import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Plus, Link2, Trash2, FolderOpen,
  ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Maximize,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ENTITY_PRESETS, DOMAIN_PRESETS, type DomainPreset, type AppNode, type AppEdge, type AppNodeData, type AppEdgeData } from '../types';
import { DynamicIcon } from '../utils/icons';

function ToolbarComponent() {
  const {
    addNode, addEdge, nodes, domain, setDomain,
    toggleScenarioPanel, toolbarCollapsed, toggleToolbar,
    selectedNodeId, selectedEdgeId, removeNode, removeEdge,
  } = useStore();
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const [showEntityMenu, setShowEntityMenu] = useState(false);
  const [showDomainMenu, setShowDomainMenu] = useState(false);
  const [showChainMenu, setShowChainMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setShowEntityMenu(false);
        setShowDomainMenu(false);
        setShowChainMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddEntity = useCallback(
    (preset: (typeof ENTITY_PRESETS)[number]) => {
      const id = crypto.randomUUID();
      // Place near center with some random offset
      const pos = screenToFlowPosition({ x: window.innerWidth / 2 + (Math.random() - 0.5) * 200, y: window.innerHeight / 2 + (Math.random() - 0.5) * 200 });
      const node: AppNode = {
        id,
        type: 'entity',
        position: pos,
        data: {
          type: 'entity',
          label: preset.label,
          entityType: preset.label,
          icon: preset.icon,
          color: preset.color,
          borderColor: preset.borderColor,
          metadata: {},
          description: '',
        } as AppNodeData,
      };
      addNode(node);
      setShowEntityMenu(false);
    },
    [addNode, screenToFlowPosition]
  );

  const handleAddValueChain = useCallback(
    (direction: 'upstream' | 'downstream') => {
      // Create a new entity and connect it to central
      const id = crypto.randomUUID();
      const xOffset = direction === 'upstream' ? -400 : 400;
      const yOffset = (Math.random() - 0.5) * 300;
      const centralNode = nodes.find((n) => n.id === 'central');
      const cx = centralNode?.position.x ?? 0;
      const cy = centralNode?.position.y ?? 0;

      const node: AppNode = {
        id,
        type: 'entity',
        position: { x: cx + xOffset, y: cy + yOffset },
        data: {
          type: 'entity',
          label: direction === 'upstream' ? 'Supplier' : 'Customer',
          entityType: direction === 'upstream' ? 'Supplier' : 'Customer',
          icon: direction === 'upstream' ? 'Factory' : 'Users',
          color: direction === 'upstream' ? '#fef3c7' : '#dbeafe',
          borderColor: direction === 'upstream' ? '#f59e0b' : '#3b82f6',
          metadata: {},
          description: '',
        } as AppNodeData,
      };

      const color = direction === 'upstream' ? '#f59e0b' : '#3b82f6';
      const edge: AppEdge = {
        id: crypto.randomUUID(),
        source: direction === 'upstream' ? id : 'central',
        target: direction === 'upstream' ? 'central' : id,
        sourceHandle: direction === 'upstream' ? 'right-src' : 'right-src',
        targetHandle: direction === 'upstream' ? 'left' : 'left',
        type: 'valueChain',
        data: {
          type: 'valueChain',
          label: direction === 'upstream' ? 'Supply' : 'Delivery',
          direction,
          color,
          width: 3,
          animated: true,
        } as AppEdgeData,
      };

      addNode(node);
      addEdge(edge);
      setShowChainMenu(false);
    },
    [addNode, addEdge, nodes]
  );

  const handleDelete = useCallback(() => {
    if (selectedNodeId) removeNode(selectedNodeId);
    if (selectedEdgeId) removeEdge(selectedEdgeId);
  }, [selectedNodeId, selectedEdgeId, removeNode, removeEdge]);

  const handleReset = useCallback(() => {
    fitView({ duration: 400 });
  }, [fitView]);

  if (toolbarCollapsed) {
    return (
      <button onClick={toggleToolbar} className="toolbar-expand-btn">
        <ChevronRight size={18} />
      </button>
    );
  }

  return (
    <div className="toolbar" ref={menuRef}>
      <div className="toolbar-section">
        <div className="toolbar-title">Value Chain Modeler</div>
        <button onClick={toggleToolbar} className="toolbar-collapse" title="Collapse">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Domain selector */}
      <div className="toolbar-section">
        <label className="toolbar-label">Domain</label>
        <button className="toolbar-btn-full" onClick={() => setShowDomainMenu(!showDomainMenu)}>
          <DynamicIcon name={DOMAIN_PRESETS[domain].icon} size={16} />
          <span>{DOMAIN_PRESETS[domain].label}</span>
        </button>
        {showDomainMenu && (
          <div className="toolbar-menu">
            {(Object.keys(DOMAIN_PRESETS) as DomainPreset[]).map((key) => (
              <button
                key={key}
                className={`toolbar-menu-item ${domain === key ? 'active' : ''}`}
                onClick={() => { setDomain(key); setShowDomainMenu(false); }}
              >
                <DynamicIcon name={DOMAIN_PRESETS[key].icon} size={16} color={DOMAIN_PRESETS[key].color} />
                <span>{DOMAIN_PRESETS[key].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Add entities */}
      <div className="toolbar-section">
        <label className="toolbar-label">Entities</label>
        <button className="toolbar-btn-full" onClick={() => setShowEntityMenu(!showEntityMenu)}>
          <Plus size={16} />
          <span>Add Entity</span>
        </button>
        {showEntityMenu && (
          <div className="toolbar-menu toolbar-menu-scroll">
            {ENTITY_PRESETS.map((preset) => (
              <button
                key={preset.label}
                className="toolbar-menu-item"
                onClick={() => handleAddEntity(preset)}
              >
                <DynamicIcon name={preset.icon} size={16} color={preset.borderColor} />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value chains */}
      <div className="toolbar-section">
        <label className="toolbar-label">Value Chains</label>
        <button className="toolbar-btn-full" onClick={() => setShowChainMenu(!showChainMenu)}>
          <Link2 size={16} />
          <span>Add Chain</span>
        </button>
        {showChainMenu && (
          <div className="toolbar-menu">
            <button className="toolbar-menu-item" onClick={() => handleAddValueChain('upstream')}>
              <span style={{ color: '#f59e0b' }}>← Upstream</span>
            </button>
            <button className="toolbar-menu-item" onClick={() => handleAddValueChain('downstream')}>
              <span style={{ color: '#3b82f6' }}>Downstream →</span>
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-divider" />

      {/* Actions */}
      <div className="toolbar-section">
        <label className="toolbar-label">Actions</label>
        <div className="toolbar-btn-row">
          <button
            className="toolbar-icon-btn danger"
            onClick={handleDelete}
            disabled={!selectedNodeId && !selectedEdgeId}
            title="Delete selected"
          >
            <Trash2 size={16} />
          </button>
          <button className="toolbar-icon-btn" onClick={() => zoomIn({ duration: 200 })} title="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button className="toolbar-icon-btn" onClick={() => zoomOut({ duration: 200 })} title="Zoom out">
            <ZoomOut size={16} />
          </button>
          <button className="toolbar-icon-btn" onClick={handleReset} title="Fit view">
            <Maximize size={16} />
          </button>
          <button className="toolbar-icon-btn" onClick={() => fitView({ duration: 400 })} title="Reset view">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Scenarios */}
      <div className="toolbar-section">
        <label className="toolbar-label">Scenarios</label>
        <button className="toolbar-btn-full" onClick={toggleScenarioPanel}>
          <FolderOpen size={16} />
          <span>Manage Scenarios</span>
        </button>
      </div>

      <div className="toolbar-hint">
        Drag to connect nodes. Click to select and edit.
      </div>
    </div>
  );
}

export const Toolbar = memo(ToolbarComponent);
