import { useEffect, useCallback, useRef } from 'react';
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

const nodeTypes: NodeTypes = {
  central: CentralNode,
  entity: EntityNode,
};

const edgeTypes: EdgeTypes = {
  valueChain: ValueChainEdge,
  relationship: RelationshipEdge,
};

function FlowCanvas() {
  const {
    nodes, edges,
    onNodesChange, onEdgesChange, onConnect,
    selectNode, selectEdge,
    loadFromStorage,
    setEdges,
  } = useStore();
  const { fitView } = useReactFlow();
  const edgeReconnectSuccessful = useRef(true);

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

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeReconnectSuccessful.current = true;
    setEdges(reconnectEdge(oldEdge, newConnection, edges) as any);
  }, [edges, setEdges]);

  const onReconnectEnd = useCallback((_: MouseEvent | TouchEvent, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      // Edge was dragged off into empty space — remove it
      setEdges(edges.filter((e) => e.id !== edge.id));
    }
    edgeReconnectSuccessful.current = true;
  }, [edges, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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
