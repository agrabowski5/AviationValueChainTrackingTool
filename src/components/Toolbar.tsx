import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Plus, Link2, Trash2, FolderOpen, GitBranchPlus,
  ChevronLeft, ChevronRight, RotateCcw, ZoomIn, ZoomOut, Maximize,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { ENTITY_PRESETS, DOMAIN_PRESETS, type DomainPreset, type AppNode, type AppEdge, type AppNodeData, type AppEdgeData } from '../types';
import { DynamicIcon } from '../utils/icons';

type ChainDirection = 'upstream' | 'downstream' | 'parallel' | 'bidirectional' | 'lateral' | 'custom';

const CHAIN_DIRECTIONS: { value: ChainDirection; label: string; color: string; symbol: string }[] = [
  { value: 'upstream',      label: 'Upstream',      color: '#f59e0b', symbol: '←' },
  { value: 'downstream',    label: 'Downstream',    color: '#3b82f6', symbol: '→' },
  { value: 'parallel',      label: 'Parallel',      color: '#10b981', symbol: '⇄' },
  { value: 'bidirectional', label: 'Bidirectional',  color: '#8b5cf6', symbol: '↔' },
  { value: 'lateral',       label: 'Lateral',        color: '#ec4899', symbol: '↕' },
  { value: 'custom',        label: 'Custom',         color: '#6b7280', symbol: '⟡' },
];

function ToolbarComponent() {
  const {
    addNode, addEdge, nodes, edges, domain, setDomain,
    toggleScenarioPanel, toolbarCollapsed, toggleToolbar,
    selectedNodeId, selectedEdgeId, removeNode, removeEdge,
    insertEntityOnEdge,
  } = useStore();
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const [showEntityMenu, setShowEntityMenu] = useState(false);
  const [showDomainMenu, setShowDomainMenu] = useState(false);
  const [showChainMenu, setShowChainMenu] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Is a value chain edge currently selected?
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const canInsertOnEdge = selectedEdge != null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setShowEntityMenu(false);
        setShowDomainMenu(false);
        setShowChainMenu(false);
        setShowInsertMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddEntity = useCallback(
    (preset: (typeof ENTITY_PRESETS)[number]) => {
      const id = crypto.randomUUID();
      const pos = screenToFlowPosition({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
      });
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

  const handleInsertOnEdge = useCallback(
    (preset: (typeof ENTITY_PRESETS)[number]) => {
      if (!selectedEdgeId) return;
      insertEntityOnEdge(selectedEdgeId, preset);
      setShowInsertMenu(false);
    },
    [selectedEdgeId, insertEntityOnEdge]
  );

  const handleAddValueChain = useCallback(
    (direction: ChainDirection) => {
      const id = crypto.randomUUID();
      const centralNode = nodes.find((n) => n.id === 'central');
      const cx = centralNode?.position.x ?? 0;
      const cy = centralNode?.position.y ?? 0;

      // Position based on direction
      let xOffset = 0, yOffset = 0;
      const spread = (Math.random() - 0.5) * 200;
      switch (direction) {
        case 'upstream':      xOffset = -400; yOffset = spread; break;
        case 'downstream':    xOffset = 400;  yOffset = spread; break;
        case 'parallel':      xOffset = spread; yOffset = -350; break;
        case 'bidirectional': xOffset = 400;  yOffset = spread; break;
        case 'lateral':       xOffset = spread; yOffset = 350;  break;
        case 'custom':        xOffset = 300 * (Math.random() > 0.5 ? 1 : -1); yOffset = 300 * (Math.random() > 0.5 ? 1 : -1); break;
      }

      const dirConfig = CHAIN_DIRECTIONS.find((d) => d.value === direction)!;
      const color = dirConfig.color;
      const defaultLabels: Record<ChainDirection, { node: string; edge: string; type: string; icon: string }> = {
        upstream:      { node: 'Supplier',      edge: 'Supply',      type: 'Supplier',  icon: 'Factory' },
        downstream:    { node: 'Customer',      edge: 'Delivery',    type: 'Customer',  icon: 'Users' },
        parallel:      { node: 'Partner',       edge: 'Cooperation', type: 'Partner',   icon: 'Globe' },
        bidirectional: { node: 'Collaborator',  edge: 'Exchange',    type: 'Partner',   icon: 'Recycle' },
        lateral:       { node: 'Support',       edge: 'Support',     type: 'Support',   icon: 'Shield' },
        custom:        { node: 'Entity',        edge: 'Connection',  type: 'Custom',    icon: 'Box' },
      };
      const labels = defaultLabels[direction];

      const node: AppNode = {
        id,
        type: 'entity',
        position: { x: cx + xOffset, y: cy + yOffset },
        data: {
          type: 'entity',
          label: labels.node,
          entityType: labels.type,
          icon: labels.icon,
          color: `${color}20`,
          borderColor: color,
          metadata: {},
          description: '',
        } as AppNodeData,
      };

      // Determine source/target based on direction
      const isIncoming = direction === 'upstream';
      const edge: AppEdge = {
        id: crypto.randomUUID(),
        source: isIncoming ? id : 'central',
        target: isIncoming ? 'central' : id,
        type: 'valueChain',
        data: {
          type: 'valueChain',
          label: labels.edge,
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

      {/* Insert entity on selected edge */}
      {canInsertOnEdge && (
        <div className="toolbar-section">
          <label className="toolbar-label">Insert on Selected Edge</label>
          <button className="toolbar-btn-full accent" onClick={() => setShowInsertMenu(!showInsertMenu)}>
            <GitBranchPlus size={16} />
            <span>Insert Entity</span>
          </button>
          {showInsertMenu && (
            <div className="toolbar-menu toolbar-menu-scroll">
              {ENTITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="toolbar-menu-item"
                  onClick={() => handleInsertOnEdge(preset)}
                >
                  <DynamicIcon name={preset.icon} size={16} color={preset.borderColor} />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Value chains */}
      <div className="toolbar-section">
        <label className="toolbar-label">Value Chains</label>
        <button className="toolbar-btn-full" onClick={() => setShowChainMenu(!showChainMenu)}>
          <Link2 size={16} />
          <span>Add Chain</span>
        </button>
        {showChainMenu && (
          <div className="toolbar-menu">
            {CHAIN_DIRECTIONS.map((dir) => (
              <button
                key={dir.value}
                className="toolbar-menu-item"
                onClick={() => handleAddValueChain(dir.value)}
              >
                <span className="chain-dir-symbol" style={{ color: dir.color }}>{dir.symbol}</span>
                <span>{dir.label}</span>
              </button>
            ))}
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
          <button className="toolbar-icon-btn" onClick={() => fitView({ duration: 400 })} title="Fit view">
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
        Drag between handle dots to connect. Click an edge, then "Insert Entity" to add nodes along it.
      </div>
    </div>
  );
}

export const Toolbar = memo(ToolbarComponent);
