import { memo, useState, useRef } from 'react';
import { X, Save, Copy, Trash2, FolderOpen, Plus, Download, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';

function ScenarioPanelComponent() {
  const {
    scenarioPanelOpen,
    toggleScenarioPanel,
    scenarios,
    activeScenarioId,
    saveScenario,
    loadScenario,
    deleteScenario,
    duplicateScenario,
    exportScenario,
    exportAllScenarios,
    importScenarios,
  } = useStore();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!scenarioPanelOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    saveScenario(name.trim(), desc.trim());
    setName('');
    setDesc('');
    setShowSaveForm(false);
  };

  const handleSaveUpdate = () => {
    const active = scenarios.find((s) => s.id === activeScenarioId);
    if (active) {
      saveScenario(active.name, active.description);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const data = JSON.parse(text);
        const count = data.scenarios?.length ?? 0;
        if (count === 0) {
          setImportMsg('No scenarios found in file.');
        } else {
          importScenarios(text);
          setImportMsg(`Imported ${count} scenario${count > 1 ? 's' : ''}.`);
        }
      } catch {
        setImportMsg('Invalid file format.');
      }
      setTimeout(() => setImportMsg(''), 3000);
    };
    reader.readAsText(file);
    // Reset so re-selecting the same file triggers onChange
    e.target.value = '';
  };

  return (
    <div className="scenario-panel">
      <div className="panel-header">
        <span>Scenarios</span>
        <button className="panel-close" onClick={toggleScenarioPanel}>
          <X size={16} />
        </button>
      </div>

      <div className="panel-body">
        {/* Save actions */}
        <div className="scenario-actions">
          {activeScenarioId && (
            <button className="scenario-btn primary" onClick={handleSaveUpdate}>
              <Save size={14} />
              <span>Save Current</span>
            </button>
          )}
          <button
            className="scenario-btn"
            onClick={() => setShowSaveForm(!showSaveForm)}
          >
            <Plus size={14} />
            <span>Save As New</span>
          </button>
        </div>

        {showSaveForm && (
          <div className="scenario-save-form">
            <input
              className="prop-input"
              placeholder="Scenario name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <textarea
              className="prop-textarea"
              placeholder="Description (optional)..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
            />
            <button className="scenario-btn primary full" onClick={handleSave}>
              <Save size={14} />
              <span>Save</span>
            </button>
          </div>
        )}

        {/* Export / Import */}
        <div className="scenario-actions" style={{ marginTop: 4 }}>
          <button
            className="scenario-btn"
            onClick={exportAllScenarios}
            disabled={scenarios.length === 0}
            title="Download all scenarios as a JSON file"
          >
            <Download size={14} />
            <span>Export All</span>
          </button>
          <button
            className="scenario-btn"
            onClick={handleImportClick}
            title="Import scenarios from a JSON file"
          >
            <Upload size={14} />
            <span>Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.valuechain.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {importMsg && (
          <div className="scenario-import-msg">{importMsg}</div>
        )}

        {/* Scenario list */}
        <div className="scenario-list">
          {scenarios.length === 0 && (
            <div className="scenario-empty">
              No saved scenarios yet. Create one to preserve your current model.
            </div>
          )}
          {scenarios.map((s) => (
            <div
              key={s.id}
              className={`scenario-card ${s.id === activeScenarioId ? 'active' : ''}`}
            >
              <div className="scenario-card-header">
                <div className="scenario-card-title">{s.name}</div>
                <div className="scenario-card-date">
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </div>
              {s.description && (
                <div className="scenario-card-desc">{s.description}</div>
              )}
              <div className="scenario-card-meta">
                {s.nodes.length} nodes · {s.edges.length} edges · {s.domain}
              </div>
              <div className="scenario-card-actions">
                <button
                  className="scenario-card-btn"
                  onClick={() => loadScenario(s.id)}
                  title="Load"
                >
                  <FolderOpen size={14} />
                </button>
                <button
                  className="scenario-card-btn"
                  onClick={() => exportScenario(s.id)}
                  title="Download"
                >
                  <Download size={14} />
                </button>
                <button
                  className="scenario-card-btn"
                  onClick={() => duplicateScenario(s.id)}
                  title="Duplicate"
                >
                  <Copy size={14} />
                </button>
                <button
                  className="scenario-card-btn danger"
                  onClick={() => deleteScenario(s.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ScenarioPanel = memo(ScenarioPanelComponent);
