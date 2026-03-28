import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CentralNodeData } from '../../types';
import { DynamicIcon } from '../../utils/icons';
import { DOMAIN_PRESETS } from '../../types';

// Generate evenly-spaced handles along each side
function makeSideHandles(position: Position, count: number, side: string) {
  const handles = [];
  for (let i = 0; i < count; i++) {
    const pct = ((i + 1) / (count + 1)) * 100;
    const style =
      position === Position.Top || position === Position.Bottom
        ? { left: `${pct}%` }
        : { top: `${pct}%` };
    handles.push(
      <Handle
        key={`${side}-tgt-${i}`}
        type="target"
        position={position}
        id={`${side}-tgt-${i}`}
        className="handle-dot"
        style={style}
      />,
      <Handle
        key={`${side}-src-${i}`}
        type="source"
        position={position}
        id={`${side}-src-${i}`}
        className="handle-dot"
        style={style}
      />,
    );
  }
  return handles;
}

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
      {/* 4 handles per side = 16 total connection points */}
      {makeSideHandles(Position.Top, 4, 'top')}
      {makeSideHandles(Position.Bottom, 4, 'bottom')}
      {makeSideHandles(Position.Left, 4, 'left')}
      {makeSideHandles(Position.Right, 4, 'right')}

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
