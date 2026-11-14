import React, { useState } from 'react';
import { BottlePreset } from '../types/hydration';
import { Wine, Plus, Edit2, Trash2, Check, RefreshCw } from 'lucide-react';
import { DEFAULT_BOTTLES } from '../data/initialData';

interface BottlesViewProps {
  bottles: BottlePreset[];
  setBottles: React.Dispatch<React.SetStateAction<BottlePreset[]>>;
  onQuickLogWithBottle: (bottle: BottlePreset) => void;
}

export const BottlesView: React.FC<BottlesViewProps> = ({
  bottles,
  setBottles,
  onQuickLogWithBottle,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [volumeMl, setVolumeMl] = useState(500);
  const [description, setDescription] = useState('');

  const handleAddBottle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBottle: BottlePreset = {
      id: `custom-b-${Date.now()}`,
      name: name.trim(),
      volumeMl,
      iconType: volumeMl > 800 ? 'jug' : volumeMl > 450 ? 'sports_bottle' : 'glass',
      description: description.trim() || `${volumeMl}ml customized hydration vessel`,
    };

    setBottles((prev) => [...prev, newBottle]);
    setName('');
    setDescription('');
    setIsAdding(false);
  };

  const handleDeleteBottle = (id: string) => {
    setBottles((prev) => prev.filter((b) => b.id !== id));
  };

  const handleResetDefaults = () => {
    setBottles(DEFAULT_BOTTLES);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Bottles & Hydration Gear
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your daily drinking vessels, calibrated volumes, and quick-log shortcuts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Vessel</span>
          </button>
        </div>
      </div>

      {/* Add Bottle Modal / Drawer */}
      {isAdding && (
        <div className="bg-slate-50 rounded-lg border border-slate-300 p-4 max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Add Calibrated Drinking Vessel</h3>
          <form onSubmit={handleAddBottle} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vessel Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanley FlowSteady Quencher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Volume (ml)
                </label>
                <input
                  type="number"
                  min="50"
                  max="3000"
                  step="25"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(Number(e.target.value))}
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Purpose
              </label>
              <input
                type="text"
                placeholder="e.g. Insulated desk straw cup for work hours"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-500"
              >
                Save Vessel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Bottle Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bottles.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
                  <Wine className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-base font-bold font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                  {b.volumeMl} ml
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-1">{b.name}</h3>
              <p className="text-xs text-slate-500 mb-4">{b.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onQuickLogWithBottle(b)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
              >
                + Quick Log {b.volumeMl}ml
              </button>

              {bottles.length > 1 && (
                <button
                  onClick={() => handleDeleteBottle(b.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                  aria-label="Delete bottle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
