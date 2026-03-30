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
import {
  DropCreateMenu,
  type DropCreateResult,
  type ConnectionTypeResult,
} from './components/DropCreateMenu';
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

interface PendingConnect {
  screenPos: { x: number; y: number };
  connection: Connection;
}

function FlowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange,
    selectNode, selectEdge,
    loadFromStorage,
    setEdges, addNode, addEdge,
  } = useStore();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const edgeReconnectSuccessful = useRef(true);
  const connectingFrom = useRef<{ nodeId: string; handleId: string | null } | null>(null);
  const lastConnectEvent = useRef<MouseEvent | TouchEvent | null>(null);
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [pendingConnect, setPendingConnect] = useState<PendingConnect | null>(null);

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

  // ── Connection tracking ───────────────────────────────────────
  const onConnectStart = useCallback((_: any, params: { nodeId: string | null; handleId: string | null }) => {
    connectingFrom.current = {
      nodeId: params.nodeId ?? '',
      handleId: params.handleId,
    };
  }, []);

  // Intercept node-to-node connections: show type picker instead of auto-creating
  const onConnect = useCallback((connection: Connection) => {
    const evt = lastConnectEvent.current;
    let clientX = window.innerWidth / 2;
    let clientY = window.innerHeight / 2;
    if (evt) {
      clientX = 'changedTouches' in evt ? evt.changedTouches[0].clientX : evt.clientX;
      clientY = 'changedTouches' in evt ? evt.changedTouches[0].clientY : evt.clientY;
    }

    setPendingConnect({
      screenPos: { x: clientX, y: clientY },
      connection,
    });
  }, []);

  const onConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    // Store the event so onConnect can read coordinates
    lastConnectEvent.current = event;

    if (!connectingFrom.current) return;

    // Check if the drop target is the pane (not a node handle)
    const target = event.target as HTMLElement;
    const isPane = target.classList.contains('react-flow__pane')
      || target.closest('.react-flow__pane');

    if (!isPane) {
      // Dropped on a node handle — onConnect will fire, we handle it there
      connectingFrom.current = null;
      return;
    }

    // Dropped into empty space — show create menu
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

  // ── Handle connection type selection (existing-to-existing) ───
  const handleConnectTypeSelect = useCallback((result: ConnectionTypeResult) => {
    if (!pendingConnect) return;
    const { connection } = pendingConnect;
    const { connectionType, direction, connectionColor } = result;

    const edgeData: AppEdgeData = connectionType === 'valueChain'
      ? {
          type: 'valueChain',
          label: direction === 'upstream' ? 'Supply'
            : direction === 'downstream' ? 'Delivery'
            : 'Flow',
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
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: connectionType,
      data: edgeData,
    };

    addEdge(edge);
    setPendingConnect(null);
  }, [pendingConnect, addEdge]);

  // ── Handle drop-to-create (new node) ──────────────────────────
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
          label: direction === 'upstream' ? 'Supply'
            : direction === 'downstream' ? 'Delivery'
            : 'Flow',
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

  const handleCancel = useCallback(() => {
    setPendingDrop(null);
    setPendingConnect(null);
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

      {/* Connection type picker for existing-to-existing */}
      {pendingConnect && (
        <DropCreateMenu
          mode="connect"
          position={pendingConnect.screenPos}
          onSelect={handleConnectTypeSelect}
          onCancel={handleCancel}
        />
      )}

      {/* Drop-to-create: connection type + entity picker */}
      {pendingDrop && (
        <DropCreateMenu
          mode="create"
          position={pendingDrop.screenPos}
          onSelect={handleDropCreate}
          onCancel={handleCancel}
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
