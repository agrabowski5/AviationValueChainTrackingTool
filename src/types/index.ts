import type { Node, Edge } from '@xyflow/react';

// ── Domain icons for the central entity ──────────────────────────
export type DomainPreset = 'aviation' | 'maritime' | 'it' | 'energy' | 'custom';

export interface DomainConfig {
  label: string;
  icon: string; // lucide icon name
  color: string;
}

export const DOMAIN_PRESETS: Record<DomainPreset, DomainConfig> = {
  aviation: { label: 'Aviation', icon: 'Plane', color: '#3b82f6' },
  maritime: { label: 'Maritime', icon: 'Ship', color: '#0ea5e9' },
  it:       { label: 'IT Infrastructure', icon: 'Server', color: '#8b5cf6' },
  energy:   { label: 'Energy', icon: 'Zap', color: '#f59e0b' },
  custom:   { label: 'Custom', icon: 'Box', color: '#6b7280' },
};

// ── Node data payloads ───────────────────────────────────────────
export interface CentralNodeData {
  type: 'central';
  label: string;
  domain: DomainPreset;
  customIcon?: string;
  color: string;
  description: string;
  [key: string]: unknown;
}

export interface EntityNodeData {
  type: 'entity';
  label: string;
  entityType: string;       // e.g. "Airline", "Fuel Producer"
  icon: string;             // lucide icon name
  color: string;
  borderColor: string;
  metadata: Record<string, string>;
  co2Contribution?: number; // tonnes
  description: string;
  [key: string]: unknown;
}

export type AppNodeData = CentralNodeData | EntityNodeData;
export type AppNode = Node<AppNodeData>;

// ── Edge data payloads ───────────────────────────────────────────
export interface ValueChainEdgeData {
  type: 'valueChain';
  label: string;
  direction: 'upstream' | 'downstream' | 'parallel' | 'bidirectional' | 'lateral' | 'custom';
  color: string;
  width: number;
  animated: boolean;
  co2Flow?: number;
  [key: string]: unknown;
}

export interface RelationshipEdgeData {
  type: 'relationship';
  label: string;
  description: string;
  color: string;
  width: number;
  dashed: boolean;
  [key: string]: unknown;
}

export type AppEdgeData = ValueChainEdgeData | RelationshipEdgeData;
export type AppEdge = Edge<AppEdgeData>;

// ── Scenario ─────────────────────────────────────────────────────
export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: AppNode[];
  edges: AppEdge[];
  domain: DomainPreset;
}

// ── Entity type presets ──────────────────────────────────────────
export interface EntityPreset {
  label: string;
  icon: string;
  color: string;
  borderColor: string;
}

export const ENTITY_PRESETS: EntityPreset[] = [
  { label: 'Airline',           icon: 'Plane',        color: '#dbeafe', borderColor: '#3b82f6' },
  { label: 'Fuel Producer',     icon: 'Fuel',         color: '#fef3c7', borderColor: '#f59e0b' },
  { label: 'Airport',           icon: 'Building2',    color: '#e0e7ff', borderColor: '#6366f1' },
  { label: 'Manufacturer',      icon: 'Factory',      color: '#fce7f3', borderColor: '#ec4899' },
  { label: 'Logistics',         icon: 'Truck',        color: '#d1fae5', borderColor: '#10b981' },
  { label: 'Government',        icon: 'Landmark',     color: '#f3e8ff', borderColor: '#8b5cf6' },
  { label: 'Passenger',         icon: 'Users',        color: '#e0f2fe', borderColor: '#0284c7' },
  { label: 'Carbon Offset',     icon: 'TreePine',     color: '#dcfce7', borderColor: '#16a34a' },
  { label: 'Maintenance',       icon: 'Wrench',       color: '#fff7ed', borderColor: '#ea580c' },
  { label: 'Custom',            icon: 'Box',          color: '#f3f4f6', borderColor: '#6b7280' },
];
