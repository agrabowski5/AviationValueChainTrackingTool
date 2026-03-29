import { useEffect, useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type Edge,
  type Connection,
  ConnectionMode,
  useReactFlow,
  reconnectEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from './store/useStore';
import { CentralNode } from './components/nodes/CentralNode';
import { EntityNode } from './components/nodes/EntityNode';
import { ValueChainEdge } from './components/edges/ValueChainEdge';
import { RelationshipEdge } from './components/edges/RelationshipEdge';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ScenarioPanel } from './components/ScenarioPanel';
import { DropCreateMenu, type DropCreateResult } from './components/DropCreateMenu';
import type { AppNode, AppEdge, AppNodeData, AppEdgeData } from './types';

const nodeTypes: NodeTypes = {
  central: CentralNode,
  entity: EntityNode,
};

const edgeTypes: EdgeTypes = {
  valueChain: ValueChainEdge,
  relationship: RelationshipEdge,
};

interface PendingDrop {
  screenPos: { x: number; y: number };
  flowPos: { x: number; y: number };
  sourceNodeId: string;
  sourceHandleId: string | null;
}

function FlowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    selectNode, selectEdge,
    loadFromStorage,
    setEdges, addNode, addEdge,
  } = useStore();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const edgeReconnectSuccessful = useRef(true);
  const connectingFrom = useRef<{ nodeId: string; handleId: string | null } | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);

  useEffect(() => {
    loadFromStorage();
    setTimeout(() => fitView({ duration: 600 }), 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => selectNode(node.id),
    [selectNode]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: any) => selectEdge(edge.id),
    [selectEdge]
  );

  const handlePaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  // ── Edge reconnection ─────────────────────────────────────────
  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeReconnectSuccessful.current = true;
    setEdges(reconnectEdge(oldEdge, newConnection, edges) as any);
  }, [edges, setEdges]);

  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges(edges.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, [edges, setEdges]);

  // ── Drag-to-create: track where the connection started ────────
  const onConnectStart = useCallback((_: any, params: { nodeId: string | null; handleId: string | null }) => {
    connectingFrom.current = {
      nodeId: params.nodeId ?? '',
      handleId: params.handleId,
    };
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!connectingFrom.current) return;

    // Check if the drop target is the pane (not a handle)
    const target = event.target as HTMLElement;
    const isPane = target.classList.contains('react-flow__pane')
      || target.closest('.react-flow__pane');

    if (!isPane) {
      connectingFrom.current = null;
      return;
    }

    // Get screen coordinates
    const clientX = 'changedTouches' in event
      ? event.changedTouches[0].clientX
      : event.clientX;
    const clientY = 'changedTouches' in event
      ? event.changedTouches[0].clientY
      : event.clientY;

    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });

    setPendingDrop({
      screenPos: { x: clientX, y: clientY },
      flowPos,
      sourceNodeId: connectingFrom.current.nodeId,
      sourceHandleId: connectingFrom.current.handleId,
    });

    connectingFrom.current = null;
  }, [screenToFlowPosition]);

  // ── Handle the menu selection ─────────────────────────────────
  const handleDropCreate = useCallback((result: DropCreateResult) => {
    if (!pendingDrop) return;

    const newNodeId = crypto.randomUUID();
    const { entityPreset, connectionType, direction, connectionColor } = result;

    const node: AppNode = {
      id: newNodeId,
      type: 'entity',
      position: pendingDrop.flowPos,
      data: {
        type: 'entity',
        label: entityPreset.label,
        entityType: entityPreset.label,
        icon: entityPreset.icon,
        color: entityPreset.color,
        borderColor: entityPreset.borderColor,
        metadata: {},
        description: '',
      } as AppNodeData,
    };

    const edgeData: AppEdgeData = connectionType === 'valueChain'
      ? {
          type: 'valueChain',
          label: direction === 'upstream' ? 'Supply' : direction === 'downstream' ? 'Delivery' : 'Flow',
          direction: direction ?? 'custom',
          color: connectionColor,
          width: 3,
          animated: true,
        }
      : {
          type: 'relationship',
          label: 'Relationship',
          description: '',
          color: connectionColor,
          width: 2,
          dashed: true,
        };

    const edge: AppEdge = {
      id: crypto.randomUUID(),
      source: pendingDrop.sourceNodeId,
      target: newNodeId,
      sourceHandle: pendingDrop.sourceHandleId ?? undefined,
      type: connectionType,
      data: edgeData,
    };

    addNode(node);
    addEdge(edge);
    selectNode(newNodeId);
    setPendingDrop(null);
  }, [pendingDrop, addNode, addEdge, selectNode]);

  const handleDropCancel = useCallback(() => {
    setPendingDrop(null);
  }, []);

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onReconnectStart={onReconnectStart}
        onReconnect={onReconnect}
        onReconnectEnd={onReconnectEnd}
        connectionMode={ConnectionMode.Loose}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        defaultEdgeOptions={{
          type: 'relationship',
          data: {
            type: 'relationship',
            label: 'Relationship',
            description: '',
            color: '#94a3b8',
            width: 1.5,
            dashed: true,
          },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.05}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'central') return '#3b82f6';
            return (node.data as any)?.borderColor || '#6b7280';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="flow-minimap"
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Drop-to-create context menu */}
      {pendingDrop && (
        <DropCreateMenu
          position={pendingDrop.screenPos}
          onSelect={handleDropCreate}
          onCancel={handleDropCancel}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <div className="app">
      <ReactFlowProvider>
        <FlowCanvas />
        <Toolbar />
        <PropertiesPanel />
        <ScenarioPanel />
      </ReactFlowProvider>
    </div>
  );
}
