import { memo, useState } from 'react';
import { DynamicIcon } from '../utils/icons';
import { ENTITY_PRESETS, type EntityPreset } from '../types';

export type ChainDirection = 'upstream' | 'downstream' | 'parallel' | 'bidirectional' | 'lateral' | 'custom';

export interface ConnectionTypeOption {
  type: 'valueChain' | 'relationship';
  direction?: ChainDirection;
  label: string;
  color: string;
  symbol: string;
}

export const CONNECTION_OPTIONS: ConnectionTypeOption[] = [
  { type: 'valueChain', direction: 'upstream',      label: 'Upstream Chain',      color: '#f59e0b', symbol: '←' },
  { type: 'valueChain', direction: 'downstream',    label: 'Downstream Chain',    color: '#3b82f6', symbol: '→' },
  { type: 'valueChain', direction: 'parallel',      label: 'Parallel Chain',      color: '#10b981', symbol: '⇄' },
  { type: 'valueChain', direction: 'bidirectional', label: 'Bidirectional Chain',  color: '#8b5cf6', symbol: '↔' },
  { type: 'valueChain', direction: 'lateral',       label: 'Lateral Chain',        color: '#ec4899', symbol: '↕' },
  { type: 'valueChain', direction: 'custom',        label: 'Custom Chain',         color: '#6b7280', symbol: '⟡' },
  { type: 'relationship',                           label: 'Relationship',         color: '#94a3b8', symbol: '┄' },
];

// Result when creating a new node + edge
export interface DropCreateResult {
  entityPreset: EntityPreset;
  connectionType: 'valueChain' | 'relationship';
  direction?: ChainDirection;
  connectionColor: string;
}

// Result when just picking a connection type between existing nodes
export interface ConnectionTypeResult {
  connectionType: 'valueChain' | 'relationship';
  direction?: ChainDirection;
  connectionColor: string;
}

// ── Mode: connect two existing nodes (connection type only) ─────
interface ConnectMenuProps {
  mode: 'connect';
  position: { x: number; y: number };
  onSelect: (result: ConnectionTypeResult) => void;
  onCancel: () => void;
}

// ── Mode: drop into empty space (connection type + entity) ──────
interface CreateMenuProps {
  mode: 'create';
  position: { x: number; y: number };
  onSelect: (result: DropCreateResult) => void;
  onCancel: () => void;
}

type DropCreateMenuProps = ConnectMenuProps | CreateMenuProps;

function DropCreateMenuComponent(props: DropCreateMenuProps) {
  const { mode, position, onCancel } = props;
  const [step, setStep] = useState<'connection' | 'entity'>('connection');
  const [selectedConnection, setSelectedConnection] = useState<ConnectionTypeOption | null>(null);

  const handleConnectionSelect = (option: ConnectionTypeOption) => {
    if (mode === 'connect') {
      // Existing-to-existing: just return the connection type
      (props as ConnectMenuProps).onSelect({
        connectionType: option.type,
        direction: option.direction,
        connectionColor: option.color,
      });
    } else {
      // Creating a new node: move to entity selection
      setSelectedConnection(option);
      setStep('entity');
    }
  };

  const handleEntitySelect = (preset: EntityPreset) => {
    if (!selectedConnection || mode !== 'create') return;
    (props as CreateMenuProps).onSelect({
      entityPreset: preset,
      connectionType: selectedConnection.type,
      direction: selectedConnection.direction,
      connectionColor: selectedConnection.color,
    });
  };

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 260),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 100,
  };

  return (
    <>
      <div className="drop-menu-backdrop" onClick={onCancel} />
      <div className="drop-menu" style={menuStyle}>
        {step === 'connection' && (
          <>
            <div className="drop-menu-header">
              {mode === 'connect' ? 'Connection Type' : 'Connection Type'}
            </div>
            <div className="drop-menu-list">
              {CONNECTION_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  className="drop-menu-item"
                  onClick={() => handleConnectionSelect(option)}
                >
                  <span className="drop-menu-symbol" style={{ color: option.color }}>
                    {option.symbol}
                  </span>
                  <span className="drop-menu-item-label">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === 'entity' && mode === 'create' && (
          <>
            <div className="drop-menu-header">
              <button className="drop-menu-back" onClick={() => setStep('connection')}>
                ←
              </button>
              Entity Type
            </div>
            <div className="drop-menu-list">
              {ENTITY_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className="drop-menu-item"
                  onClick={() => handleEntitySelect(preset)}
                >
                  <DynamicIcon name={preset.icon} size={16} color={preset.borderColor} />
                  <span className="drop-menu-item-label">{preset.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export const DropCreateMenu = memo(DropCreateMenuComponent);
