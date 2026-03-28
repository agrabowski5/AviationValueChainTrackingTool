import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EntityNodeData } from '../../types';
import { DynamicIcon } from '../../utils/icons';

function EntityNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as EntityNodeData;
  const color = d.borderColor || '#6b7280';
  const bg = d.color || '#f3f4f6';

  return (
    <div
      className="entity-node"
      style={{
        borderColor: selected ? '#fff' : color,
        backgroundColor: bg,
        boxShadow: selected
          ? `0 0 0 3px ${color}, 0 4px 20px ${color}30`
          : `0 2px 10px rgba(0,0,0,0.1)`,
      }}
    >
      <Handle type="target" position={Position.Top} id="top" className="handle-dot" />
      <Handle type="source" position={Position.Top} id="top-src" className="handle-dot" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="handle-dot" />
      <Handle type="source" position={Position.Bottom} id="bottom-src" className="handle-dot" />
      <Handle type="target" position={Position.Left} id="left" className="handle-dot" />
      <Handle type="source" position={Position.Left} id="left-src" className="handle-dot" />
      <Handle type="target" position={Position.Right} id="right" className="handle-dot" />
      <Handle type="source" position={Position.Right} id="right-src" className="handle-dot" />

      <div className="entity-header" style={{ borderBottomColor: `${color}30` }}>
        <div className="entity-icon" style={{ backgroundColor: `${color}20` }}>
          <DynamicIcon name={d.icon || 'Box'} size={18} color={color} strokeWidth={2} />
        </div>
        <div className="entity-titles">
          <div className="entity-label">{d.label}</div>
          <div className="entity-type" style={{ color }}>{d.entityType}</div>
        </div>
      </div>

      {d.co2Contribution !== undefined && d.co2Contribution > 0 && (
        <div className="entity-co2">
          <DynamicIcon name="Cloud" size={12} color="#ef4444" strokeWidth={2} />
          <span>{d.co2Contribution.toLocaleString()} t CO₂</span>
        </div>
      )}

      {Object.keys(d.metadata || {}).length > 0 && (
        <div className="entity-meta-count">
          {Object.keys(d.metadata).length} metadata field{Object.keys(d.metadata).length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export const EntityNode = memo(EntityNodeComponent);
