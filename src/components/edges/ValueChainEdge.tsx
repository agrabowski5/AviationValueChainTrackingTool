import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ValueChainEdgeData } from '../../types';

function ValueChainEdgeComponent(props: EdgeProps) {
  const {
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    data, selected, markerEnd,
  } = props;
  const d = data as unknown as ValueChainEdgeData;
  const color = d?.color || '#3b82f6';
  const width = d?.width || 3;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      {/* Wider invisible path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: color,
          strokeWidth: selected ? width + 2 : width,
          filter: selected ? `drop-shadow(0 0 6px ${color})` : undefined,
          animation: d?.animated ? 'flow-dash 1s linear infinite' : undefined,
          strokeDasharray: d?.animated ? '8 4' : undefined,
        }}
      />
      {(d?.label || d?.co2Flow) && (
        <EdgeLabelRenderer>
          <div
            className="edge-label value-chain-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: color,
              color,
            }}
          >
            {d.label && <span className="edge-label-text">{d.label}</span>}
            {d.co2Flow !== undefined && d.co2Flow > 0 && (
              <span className="edge-co2">{d.co2Flow.toLocaleString()} t CO₂</span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const ValueChainEdge = memo(ValueChainEdgeComponent);
