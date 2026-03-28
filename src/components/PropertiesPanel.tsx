import { memo, useState, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DynamicIcon, ICON_OPTIONS } from '../utils/icons';
import type {
  CentralNodeData,
  EntityNodeData,
  ValueChainEdgeData,
  RelationshipEdgeData,
} from '../types';

function PropertiesPanelComponent() {
  const {
    nodes, edges,
    selectedNodeId, selectedEdgeId,
    propertiesPanelOpen,
    updateNodeData, updateEdgeData,
    selectNode, selectEdge,
    removeEdge, removeNode,
  } = useStore();

  if (!propertiesPanelOpen) return null;

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  if (!selectedNode && !selectedEdge) return null;

  // Get all edges connected to the selected node
  const connectedEdges = selectedNode
    ? edges.filter((e) => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <span>Properties</span>
        <button
          className="panel-close"
          onClick={() => {
            selectNode(null);
            selectEdge(null);
          }}
        >
          <X size={16} />
        </button>
      </div>
      <div className="panel-body">
        {selectedNode && selectedNode.data.type === 'central' && (
          <CentralNodeProperties
            data={selectedNode.data as unknown as CentralNodeData}
            onChange={(d) => updateNodeData(selectedNode.id, d)}
          />
        )}
        {selectedNode && selectedNode.data.type === 'entity' && (
          <>
            <EntityNodeProperties
              data={selectedNode.data as unknown as EntityNodeData}
              onChange={(d) => updateNodeData(selectedNode.id, d)}
            />
            {/* Delete node button */}
            <div className="prop-divider" />
            <button
              className="prop-danger-btn"
              onClick={() => removeNode(selectedNode.id)}
            >
              <Trash2 size={14} />
              <span>Delete Entity</span>
            </button>
          </>
        )}

        {/* Connections list for selected node */}
        {selectedNode && connectedEdges.length > 0 && (
          <ConnectionsList
            nodeId={selectedNode.id}
            connectedEdges={connectedEdges}
            nodes={nodes}
            onDeleteEdge={removeEdge}
            onSelectEdge={selectEdge}
          />
        )}

        {selectedEdge && (selectedEdge.data as any)?.type === 'valueChain' && (
          <>
            <ValueChainEdgeProperties
              data={selectedEdge.data as unknown as ValueChainEdgeData}
              onChange={(d) => updateEdgeData(selectedEdge.id, d)}
            />
            <div className="prop-divider" />
            <button
              className="prop-danger-btn"
              onClick={() => removeEdge(selectedEdge.id)}
            >
              <Trash2 size={14} />
              <span>Delete Connection</span>
            </button>
          </>
        )}
        {selectedEdge && (selectedEdge.data as any)?.type === 'relationship' && (
          <>
            <RelationshipEdgeProperties
              data={selectedEdge.data as unknown as RelationshipEdgeData}
              onChange={(d) => updateEdgeData(selectedEdge.id, d)}
            />
            <div className="prop-divider" />
            <button
              className="prop-danger-btn"
              onClick={() => removeEdge(selectedEdge.id)}
            >
              <Trash2 size={14} />
              <span>Delete Connection</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Connections list for a node ─────────────────────────────────
function ConnectionsList({
  nodeId,
  connectedEdges,
  nodes,
  onDeleteEdge,
  onSelectEdge,
}: {
  nodeId: string;
  connectedEdges: any[];
  nodes: any[];
  onDeleteEdge: (id: string) => void;
  onSelectEdge: (id: string) => void;
}) {
  const getNodeLabel = (id: string) => {
    const node = nodes.find((n: any) => n.id === id);
    return (node?.data as any)?.label || id;
  };

  return (
    <>
      <div className="prop-divider" />
      <h3 className="prop-title">Connections ({connectedEdges.length})</h3>
      <div className="connections-list">
        {connectedEdges.map((edge) => {
          const isSource = edge.source === nodeId;
          const otherNodeId = isSource ? edge.target : edge.source;
          const edgeLabel = (edge.data as any)?.label || 'Untitled';
          const edgeType = (edge.data as any)?.type || 'relationship';
          const dirArrow = isSource ? '→' : '←';

          return (
            <div key={edge.id} className="connection-row">
              <button
                className="connection-info"
                onClick={() => onSelectEdge(edge.id)}
                title="Click to edit this connection"
              >
                <span className="connection-dir">{dirArrow}</span>
                <span className="connection-label">{edgeLabel}</span>
                <span className="connection-target">{getNodeLabel(otherNodeId)}</span>
                <span className={`connection-type ${edgeType}`}>
                  {edgeType === 'valueChain' ? 'chain' : 'rel'}
                </span>
              </button>
              <button
                className="connection-delete"
                onClick={() => onDeleteEdge(edge.id)}
                title="Delete this connection"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="connection-hint">
        Drag edge endpoints on the canvas to reconnect to different ports.
        Drop into empty space to delete.
      </div>
    </>
  );
}

// ── Central Node Props ──────────────────────────────────────────
function CentralNodeProperties({
  data,
  onChange,
}: {
  data: CentralNodeData;
  onChange: (d: Partial<CentralNodeData>) => void;
}) {
  return (
    <div className="prop-group">
      <h3 className="prop-title">Central Entity</h3>

      <label className="prop-label">Label</label>
      <input
        className="prop-input"
        value={data.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <label className="prop-label">Description</label>
      <textarea
        className="prop-textarea"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
      />

      <label className="prop-label">Color</label>
      <input
        type="color"
        className="prop-color"
        value={data.color}
        onChange={(e) => onChange({ color: e.target.value })}
      />

      <label className="prop-label">Icon</label>
      <IconPicker
        value={data.customIcon || ''}
        onChange={(icon) => onChange({ customIcon: icon })}
      />
    </div>
  );
}

// ── Entity Node Props ───────────────────────────────────────────
function EntityNodeProperties({
  data,
  onChange,
}: {
  data: EntityNodeData;
  onChange: (d: Partial<EntityNodeData>) => void;
}) {
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const addMeta = useCallback(() => {
    if (!newKey.trim()) return;
    onChange({ metadata: { ...data.metadata, [newKey]: newVal } });
    setNewKey('');
    setNewVal('');
  }, [newKey, newVal, data.metadata, onChange]);

  const removeMeta = useCallback(
    (key: string) => {
      const m = { ...data.metadata };
      delete m[key];
      onChange({ metadata: m });
    },
    [data.metadata, onChange]
  );

  return (
    <div className="prop-group">
      <h3 className="prop-title">Entity</h3>

      <label className="prop-label">Label</label>
      <input
        className="prop-input"
        value={data.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <label className="prop-label">Entity Type</label>
      <input
        className="prop-input"
        value={data.entityType}
        onChange={(e) => onChange({ entityType: e.target.value })}
      />

      <label className="prop-label">Description</label>
      <textarea
        className="prop-textarea"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
      />

      <label className="prop-label">CO₂ Contribution (tonnes)</label>
      <input
        type="number"
        className="prop-input"
        value={data.co2Contribution ?? ''}
        onChange={(e) =>
          onChange({ co2Contribution: e.target.value ? Number(e.target.value) : undefined })
        }
      />

      <label className="prop-label">Background Color</label>
      <input
        type="color"
        className="prop-color"
        value={data.color}
        onChange={(e) => onChange({ color: e.target.value })}
      />

      <label className="prop-label">Border Color</label>
      <input
        type="color"
        className="prop-color"
        value={data.borderColor}
        onChange={(e) => onChange({ borderColor: e.target.value })}
      />

      <label className="prop-label">Icon</label>
      <IconPicker
        value={data.icon}
        onChange={(icon) => onChange({ icon })}
      />

      {/* Metadata */}
      <div className="prop-divider" />
      <h3 className="prop-title">Metadata</h3>
      {Object.entries(data.metadata || {}).map(([key, val]) => (
        <div key={key} className="meta-row">
          <span className="meta-key">{key}</span>
          <input
            className="meta-val-input"
            value={val}
            onChange={(e) =>
              onChange({ metadata: { ...data.metadata, [key]: e.target.value } })
            }
          />
          <button className="meta-del" onClick={() => removeMeta(key)}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="meta-add-row">
        <input
          className="meta-add-input"
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          className="meta-add-input"
          placeholder="Value"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
        />
        <button className="meta-add-btn" onClick={addMeta}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Value Chain Edge Props ───────────────────────────────────────
function ValueChainEdgeProperties({
  data,
  onChange,
}: {
  data: ValueChainEdgeData;
  onChange: (d: Partial<ValueChainEdgeData>) => void;
}) {
  return (
    <div className="prop-group">
      <h3 className="prop-title">Value Chain</h3>

      <label className="prop-label">Label</label>
      <input
        className="prop-input"
        value={data.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <label className="prop-label">Direction</label>
      <select
        className="prop-select"
        value={data.direction}
        onChange={(e) => onChange({ direction: e.target.value as any })}
      >
        <option value="upstream">Upstream</option>
        <option value="downstream">Downstream</option>
        <option value="parallel">Parallel</option>
        <option value="bidirectional">Bidirectional</option>
        <option value="lateral">Lateral</option>
        <option value="custom">Custom</option>
      </select>

      <label className="prop-label">CO₂ Flow (tonnes)</label>
      <input
        type="number"
        className="prop-input"
        value={data.co2Flow ?? ''}
        onChange={(e) =>
          onChange({ co2Flow: e.target.value ? Number(e.target.value) : undefined })
        }
      />

      <label className="prop-label">Color</label>
      <input
        type="color"
        className="prop-color"
        value={data.color}
        onChange={(e) => onChange({ color: e.target.value })}
      />

      <label className="prop-label">Width ({data.width}px)</label>
      <input
        type="range"
        min="1"
        max="12"
        value={data.width}
        onChange={(e) => onChange({ width: Number(e.target.value) })}
      />

      <label className="prop-label-inline">
        <input
          type="checkbox"
          checked={data.animated}
          onChange={(e) => onChange({ animated: e.target.checked })}
        />
        Animated flow
      </label>
    </div>
  );
}

// ── Relationship Edge Props ─────────────────────────────────────
function RelationshipEdgeProperties({
  data,
  onChange,
}: {
  data: RelationshipEdgeData;
  onChange: (d: Partial<RelationshipEdgeData>) => void;
}) {
  return (
    <div className="prop-group">
      <h3 className="prop-title">Relationship</h3>

      <label className="prop-label">Label</label>
      <input
        className="prop-input"
        value={data.label}
        onChange={(e) => onChange({ label: e.target.value })}
      />

      <label className="prop-label">Description</label>
      <textarea
        className="prop-textarea"
        value={data.description}
        onChange={(e) => onChange({ description: e.target.value })}
        rows={3}
      />

      <label className="prop-label">Color</label>
      <input
        type="color"
        className="prop-color"
        value={data.color}
        onChange={(e) => onChange({ color: e.target.value })}
      />

      <label className="prop-label">Width ({data.width}px)</label>
      <input
        type="range"
        min="1"
        max="8"
        value={data.width}
        onChange={(e) => onChange({ width: Number(e.target.value) })}
      />

      <label className="prop-label-inline">
        <input
          type="checkbox"
          checked={data.dashed}
          onChange={(e) => onChange({ dashed: e.target.checked })}
        />
        Dashed line
      </label>
    </div>
  );
}

// ── Icon Picker ─────────────────────────────────────────────────
function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="icon-picker">
      <button className="icon-picker-trigger" onClick={() => setOpen(!open)}>
        <DynamicIcon name={value || 'Box'} size={18} />
        <span>{value || 'Default'}</span>
      </button>
      {open && (
        <div className="icon-picker-grid">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              className={`icon-picker-item ${value === icon ? 'active' : ''}`}
              onClick={() => {
                onChange(icon);
                setOpen(false);
              }}
              title={icon}
            >
              <DynamicIcon name={icon} size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const PropertiesPanel = memo(PropertiesPanelComponent);
