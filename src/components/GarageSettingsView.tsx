import React, { useState } from 'react';
import {
  GarageConfig,
  InventoryItem,
  ServiceTemplate,
  ServiceTemplateMaterial,
} from '../types/fleet';
import { Warehouse, CheckCircle2, Plus, Trash2, Wrench } from 'lucide-react';

interface GarageSettingsViewProps {
  garageConfig: GarageConfig;
  serviceTemplates: ServiceTemplate[];
  inventory: InventoryItem[];
  onUpdateGarageConfig: (updates: Partial<GarageConfig>) => void;
  onCreateTemplate: (tpl: Omit<ServiceTemplate, 'id' | 'isCustom'>) => ServiceTemplate;
}

export const GarageSettingsView: React.FC<GarageSettingsViewProps> = ({
  garageConfig,
  serviceTemplates,
  inventory,
  onUpdateGarageConfig,
  onCreateTemplate,
}) => {
  const [form, setForm] = useState<GarageConfig>(garageConfig);
  const [savedBanner, setSavedBanner] = useState(false);

  // Custom Service Template Creator
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplLabour, setTplLabour] = useState('1500');
  const [tplMaterials, setTplMaterials] = useState<ServiceTemplateMaterial[]>([]);
  const [pickItemId, setPickItemId] = useState(inventory[0]?.id || '');
  const [pickQty, setPickQty] = useState('1');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGarageConfig(form);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2800);
  };

  const handleAddTplMaterial = () => {
    const inv = inventory.find((i) => i.id === pickItemId);
    if (!inv) return;
    setTplMaterials((prev) => [
      ...prev,
      {
        id: `tm-custom-${Date.now()}`,
        inventoryItemId: inv.id,
        partName: inv.partName,
        sku: inv.sku,
        unit: inv.unit,
        defaultQuantity: Math.max(0.1, parseFloat(pickQty) || 1),
      },
    ]);
  };

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplName.trim()) return;
    onCreateTemplate({
      name: tplName.trim(),
      description: tplDesc.trim() || 'Custom garage service package',
      defaultLabourCharge: Math.max(0, parseFloat(tplLabour) || 0),
      materials: tplMaterials,
    });
    setTplName('');
    setTplDesc('');
    setTplLabour('1500');
    setTplMaterials([]);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="pb-3 border-b border-slate-200">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          SINGLE-GARAGE CONFIGURATION
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5 flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-[#0051a8]" />
          <span>Garage Branding, Tax & Service Templates</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          All vehicles, inventory parts, suppliers, repair jobs, and invoices belong exclusively to this single garage facility.
        </p>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Garage configuration saved. All new invoices will reflect updated branding and tax rules.</span>
        </div>
      )}

      {/* Garage Branding & Tax Form */}
      <form
        onSubmit={handleSaveConfig}
        className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4 text-xs"
      >
        <h2 className="text-sm font-bold text-slate-900">Garage Identity & Invoice Configuration</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Garage Name *</label>
            <input
              type="text"
              required
              value={form.garageName}
              onChange={(e) => setForm({ ...form, garageName: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Garage Address *</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">GSTIN / Tax Registration</label>
            <input
              type="text"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Apply GST / Tax</label>
            <label className="flex items-center gap-2 p-2 border border-slate-200 rounded bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.taxEnabled}
                onChange={(e) => setForm({ ...form, taxEnabled: e.target.checked })}
              />
              <span className="font-semibold">{form.taxEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.5"
              value={form.taxRatePercent}
              onChange={(e) =>
                setForm({ ...form, taxRatePercent: parseFloat(e.target.value) || 0 })
              }
              className="w-full p-2 border border-slate-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
              className="w-full p-2 border border-slate-300 rounded font-mono uppercase"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={form.currencySymbol}
              onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 bg-[#0051a8] hover:bg-[#003d80] text-white font-bold rounded shadow-2xs"
          >
            Save Garage Settings
          </button>
        </div>
      </form>

      {/* Configurable Service Templates */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs space-y-4 text-xs">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#0051a8]" />
            <span>Service Type Material Templates ({serviceTemplates.length})</span>
          </h2>
          <p className="text-slate-500 mt-0.5">
            Default spare-parts estimates automatically loaded during service booking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {serviceTemplates.map((tpl) => (
            <div key={tpl.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-900">{tpl.name}</span>
                <span className="font-mono font-bold text-slate-700">
                  Labour: {garageConfig.currencySymbol}
                  {tpl.defaultLabourCharge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">{tpl.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {tpl.materials.length === 0 ? (
                  <span className="text-[10px] text-slate-400">No default parts</span>
                ) : (
                  tpl.materials.map((m) => (
                    <span
                      key={m.id}
                      className="text-[10px] font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700"
                    >
                      {m.partName}: {m.defaultQuantity} {m.unit}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Create Custom Service Template */}
        <form
          onSubmit={handleCreateTemplate}
          className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3"
        >
          <h3 className="font-bold text-slate-900">Create Custom Service Template</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Service Type Name (e.g. Suspension Audit)"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
              className="p-2 border border-slate-300 rounded bg-white"
            />
            <input
              type="text"
              placeholder="Short Description"
              value={tplDesc}
              onChange={(e) => setTplDesc(e.target.value)}
              className="p-2 border border-slate-300 rounded bg-white"
            />
            <input
              type="number"
              min="0"
              placeholder="Default Labour"
              value={tplLabour}
              onChange={(e) => setTplLabour(e.target.value)}
              className="p-2 border border-slate-300 rounded bg-white font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pickItemId}
              onChange={(e) => setPickItemId(e.target.value)}
              className="p-2 border border-slate-300 rounded bg-white"
            >
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.partName} ({i.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={pickQty}
              onChange={(e) => setPickQty(e.target.value)}
              className="w-20 p-2 border border-slate-300 rounded bg-white font-mono"
            />
            <button
              type="button"
              onClick={handleAddTplMaterial}
              className="px-3 py-2 bg-slate-800 text-white rounded font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Material</span>
            </button>
          </div>

          {tplMaterials.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tplMaterials.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono"
                >
                  <span>
                    {m.partName} × {m.defaultQuantity} {m.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTplMaterials((prev) => prev.filter((x) => x.id !== m.id))
                    }
                    className="text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded"
            >
              Save Service Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
