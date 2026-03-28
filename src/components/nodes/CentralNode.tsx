import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CentralNodeData } from '../../types';
import { DynamicIcon } from '../../utils/icons';
import { DOMAIN_PRESETS } from '../../types';

function CentralNodeComponent({ data, selected }: NodeProps) {
  const d = data as unknown as CentralNodeData;
  const preset = DOMAIN_PRESETS[d.domain] ?? DOMAIN_PRESETS.custom;
  const color = d.color || preset.color;
  const iconName = d.customIcon || preset.icon;

  return (
    <div
      className="central-node"
      style={{
        borderColor: selected ? '#fff' : color,
        boxShadow: selected
          ? `0 0 0 3px ${color}, 0 0 30px ${color}40`
          : `0 0 20px ${color}30`,
      }}
    >
      {/* Handles for all 4 sides */}
      <Handle type="target" position={Position.Top} id="top" className="handle-dot" />
      <Handle type="source" position={Position.Top} id="top-src" className="handle-dot" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="handle-dot" />
      <Handle type="source" position={Position.Bottom} id="bottom-src" className="handle-dot" />
      <Handle type="target" position={Position.Left} id="left" className="handle-dot" />
      <Handle type="source" position={Position.Left} id="left-src" className="handle-dot" />
      <Handle type="target" position={Position.Right} id="right" className="handle-dot" />
      <Handle type="source" position={Position.Right} id="right-src" className="handle-dot" />

      <div
        className="central-icon-ring"
        style={{ background: `linear-gradient(135deg, ${color}20, ${color}40)` }}
      >
        <DynamicIcon name={iconName} size={40} color={color} strokeWidth={1.5} />
      </div>
      <div className="central-label" style={{ color }}>{d.label}</div>
      {d.description && (
        <div className="central-desc">{d.description}</div>
      )}
    </div>
  );
}

export const CentralNode = memo(CentralNodeComponent);
