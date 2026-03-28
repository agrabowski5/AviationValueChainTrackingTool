import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import type { RelationshipEdgeData } from '../../types';

function RelationshipEdgeComponent(props: EdgeProps) {
  const {
    sourceX, sourceY,
    targetX, targetY,
    data, selected, markerEnd,
  } = props;
  const d = data as unknown as RelationshipEdgeData;
  const color = d?.color || '#94a3b8';
  const width = d?.width || 1.5;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX, sourceY,
    targetX, targetY,
  });

  return (
    <>
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
          strokeWidth: selected ? width + 1.5 : width,
          strokeDasharray: d?.dashed ? '6 4' : undefined,
          filter: selected ? `drop-shadow(0 0 4px ${color})` : undefined,
        }}
      />
      {d?.label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label relationship-label"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: `${color}60`,
              color,
            }}
          >
            <span className="edge-label-text">{d.label}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
