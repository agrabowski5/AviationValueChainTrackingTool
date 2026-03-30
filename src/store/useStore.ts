import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type {
  AppNode,
  AppEdge,
  Scenario,
  DomainPreset,
  AppNodeData,
  AppEdgeData,
} from '../types';

// ── helpers ──────────────────────────────────────────────────────
const uid = () => crypto.randomUUID();

function makeDefaultCentralNode(domain: DomainPreset): AppNode {
  const presets: Record<DomainPreset, { label: string; color: string }> = {
    aviation: { label: 'Aircraft', color: '#3b82f6' },
    maritime: { label: 'Vessel', color: '#0ea5e9' },
    it: { label: 'Data Center', color: '#8b5cf6' },
    energy: { label: 'Power Plant', color: '#f59e0b' },
    custom: { label: 'Central Entity', color: '#6b7280' },
  };
  const p = presets[domain];
  return {
    id: 'central',
    type: 'central',
    position: { x: 0, y: 0 },
    data: {
      type: 'central',
      label: p.label,
      domain,
      color: p.color,
      description: '',
    } as AppNodeData,
  };
}

// ── store types ──────────────────────────────────────────────────
interface AppState {
  // canvas
  nodes: AppNode[];
  edges: AppEdge[];
  domain: DomainPreset;

  // selection
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // panels
  propertiesPanelOpen: boolean;
  scenarioPanelOpen: boolean;
  toolbarCollapsed: boolean;

  // scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;

  // actions – canvas
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: AppEdge[]) => void;
  addNode: (node: AppNode) => void;
  addEdge: (edge: AppEdge) => void;
  updateNodeData: (id: string, data: Partial<AppNodeData>) => void;
  updateEdgeData: (id: string, data: Partial<AppEdgeData>) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  reconnectEdge: (oldEdge: AppEdge, newConnection: Connection) => void;
  insertEntityOnEdge: (edgeId: string, preset: { label: string; icon: string; color: string; borderColor: string }) => void;

  // actions – selection
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;

  // actions – domain
  setDomain: (d: DomainPreset) => void;

  // actions – panels
  togglePropertiesPanel: () => void;
  toggleScenarioPanel: () => void;
  toggleToolbar: () => void;

  // actions – scenarios
  saveScenario: (name: string, description: string) => void;
  loadScenario: (id: string) => void;
  deleteScenario: (id: string) => void;
  duplicateScenario: (id: string) => void;

  // export / import
  exportScenario: (id: string) => void;
  exportAllScenarios: () => void;
  importScenarios: (json: string) => void;

  // persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'valuechain-scenarios';
const ACTIVE_KEY = 'valuechain-active';

export const useStore = create<AppState>((set, get) => ({
  nodes: [makeDefaultCentralNode('aviation')],
  edges: [],
  domain: 'aviation',

  selectedNodeId: null,
  selectedEdgeId: null,

  propertiesPanelOpen: false,
  scenarioPanelOpen: false,
  toolbarCollapsed: false,

  scenarios: [],
  activeScenarioId: null,

  // ── canvas ────────────────────────────────────────────────────
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) as AppNode[] }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) as AppEdge[] }),
  onConnect: (connection) => {
    const edge: AppEdge = {
      id: uid(),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'relationship',
      data: {
        type: 'relationship',
        label: 'Relationship',
        description: '',
        color: '#94a3b8',
        width: 2,
        dashed: true,
      } as AppEdgeData,
    };
    set({ edges: [...get().edges, edge] });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
  addEdge: (edge) => set({ edges: [...get().edges, edge] }),
  updateNodeData: (id, data) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } as AppNodeData } : n
      ),
    }),
  updateEdgeData: (id, data) =>
    set({
      edges: get().edges.map((e) =>
        e.id === id ? { ...e, data: { ...e.data, ...data } as AppEdgeData } : e
      ),
    }),
  removeNode: (id) => {
    if (id === 'central') return; // cannot delete central node
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },
  removeEdge: (id) =>
    set({
      edges: get().edges.filter((e) => e.id !== id),
      selectedEdgeId: get().selectedEdgeId === id ? null : get().selectedEdgeId,
    }),

  reconnectEdge: (oldEdge, newConnection) => {
    set({
      edges: get().edges.map((e) =>
        e.id === oldEdge.id
          ? {
              ...e,
              source: newConnection.source,
              target: newConnection.target,
              sourceHandle: newConnection.sourceHandle ?? undefined,
              targetHandle: newConnection.targetHandle ?? undefined,
            }
          : e
      ),
    });
  },

  // Insert a new entity node in the middle of an existing edge, splitting it in two
  insertEntityOnEdge: (edgeId, preset) => {
    const edge = get().edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const sourceNode = get().nodes.find((n) => n.id === edge.source);
    const targetNode = get().nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    const newNodeId = uid();
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;

    const newNode: AppNode = {
      id: newNodeId,
      type: 'entity',
      position: { x: midX, y: midY },
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

    // Create two new edges that inherit the original edge's styling
    const edgeData = edge.data ? structuredClone(edge.data) : undefined;
    const edge1: AppEdge = {
      id: uid(),
      source: edge.source,
      target: newNodeId,
      sourceHandle: edge.sourceHandle,
      type: edge.type,
      data: edgeData ? { ...edgeData } as AppEdgeData : undefined,
    };
    const edge2: AppEdge = {
      id: uid(),
      source: newNodeId,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: edge.type,
      data: edgeData ? { ...edgeData } as AppEdgeData : undefined,
    };

    set({
      nodes: [...get().nodes, newNode],
      edges: [...get().edges.filter((e) => e.id !== edgeId), edge1, edge2],
      selectedNodeId: newNodeId,
      selectedEdgeId: null,
      propertiesPanelOpen: true,
    });
  },

  // ── selection ─────────────────────────────────────────────────
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null, propertiesPanelOpen: id !== null }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null, propertiesPanelOpen: id !== null }),

  // ── domain ────────────────────────────────────────────────────
  setDomain: (domain) => {
    const central = makeDefaultCentralNode(domain);
    const existingCentral = get().nodes.find((n) => n.id === 'central');
    set({
      domain,
      nodes: get().nodes.map((n) =>
        n.id === 'central'
          ? {
              ...central,
              position: existingCentral?.position ?? central.position,
              data: {
                ...central.data,
                label: (existingCentral?.data as any)?.label || central.data.label,
                description: (existingCentral?.data as any)?.description || '',
              } as AppNodeData,
            }
          : n
      ),
    });
  },

  // ── panels ────────────────────────────────────────────────────
  togglePropertiesPanel: () => set({ propertiesPanelOpen: !get().propertiesPanelOpen }),
  toggleScenarioPanel: () => set({ scenarioPanelOpen: !get().scenarioPanelOpen }),
  toggleToolbar: () => set({ toolbarCollapsed: !get().toolbarCollapsed }),

  // ── scenarios ─────────────────────────────────────────────────
  saveScenario: (name, description) => {
    const id = get().activeScenarioId ?? uid();
    const now = new Date().toISOString();
    const existing = get().scenarios.find((s) => s.id === id);
    const scenario: Scenario = {
      id,
      name,
      description,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      nodes: structuredClone(get().nodes),
      edges: structuredClone(get().edges),
      domain: get().domain,
    };
    const scenarios = existing
      ? get().scenarios.map((s) => (s.id === id ? scenario : s))
      : [...get().scenarios, scenario];
    set({ scenarios, activeScenarioId: id });
    get().saveToStorage();
  },
  loadScenario: (id) => {
    const scenario = get().scenarios.find((s) => s.id === id);
    if (!scenario) return;
    set({
      nodes: structuredClone(scenario.nodes),
      edges: structuredClone(scenario.edges),
      domain: scenario.domain,
      activeScenarioId: id,
      selectedNodeId: null,
      selectedEdgeId: null,
    });
    get().saveToStorage();
  },
  deleteScenario: (id) => {
    set({
      scenarios: get().scenarios.filter((s) => s.id !== id),
      activeScenarioId: get().activeScenarioId === id ? null : get().activeScenarioId,
    });
    get().saveToStorage();
  },
  duplicateScenario: (id) => {
    const scenario = get().scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const newId = uid();
    const dup: Scenario = {
      ...structuredClone(scenario),
      id: newId,
      name: `${scenario.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({ scenarios: [...get().scenarios, dup] });
    get().saveToStorage();
  },

  // ── export / import ───────────────────────────────────────────
  exportScenario: (id) => {
    const scenario = get().scenarios.find((s) => s.id === id);
    if (!scenario) return;
    const blob = new Blob(
      [JSON.stringify({ version: 1, scenarios: [scenario] }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/[^a-zA-Z0-9-_ ]/g, '')}.valuechain.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  exportAllScenarios: () => {
    const { scenarios } = get();
    if (scenarios.length === 0) return;
    const blob = new Blob(
      [JSON.stringify({ version: 1, scenarios }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-scenarios-${new Date().toISOString().slice(0, 10)}.valuechain.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  importScenarios: (json) => {
    try {
      const data = JSON.parse(json);
      const imported: Scenario[] = data.scenarios ?? [];
      if (!Array.isArray(imported) || imported.length === 0) return;

      // Assign new IDs to avoid collisions with existing scenarios
      const existingIds = new Set(get().scenarios.map((s) => s.id));
      const remapped = imported.map((s) => {
        if (existingIds.has(s.id)) {
          return { ...s, id: uid(), name: s.name + ' (imported)' };
        }
        return s;
      });

      set({ scenarios: [...get().scenarios, ...remapped] });
      get().saveToStorage();
    } catch { /* invalid JSON */ }
  },

  // ── persistence ───────────────────────────────────────────────
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_KEY);
      if (raw) {
        const scenarios: Scenario[] = JSON.parse(raw);
        set({ scenarios });
        if (activeId) {
          const s = scenarios.find((sc) => sc.id === activeId);
          if (s) {
            set({
              nodes: structuredClone(s.nodes),
              edges: structuredClone(s.edges),
              domain: s.domain,
              activeScenarioId: activeId,
            });
          }
        }
      }
    } catch { /* ignore corrupt storage */ }
  },
  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().scenarios));
      if (get().activeScenarioId) {
        localStorage.setItem(ACTIVE_KEY, get().activeScenarioId!);
      }
    } catch { /* storage full */ }
  },
}));
