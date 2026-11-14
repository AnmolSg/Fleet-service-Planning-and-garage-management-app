import React, { useState } from 'react';
import { VehicleCategory } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import { Check, X, AlertCircle, Warehouse } from 'lucide-react';

interface RegisterVehicleViewProps {
  garageName: string;
  onRegister: (data: {
    registrationNumber: string;
    category: VehicleCategory;
    manufacturer: string;
    model: string;
    manufacturingYear: number;
    odometer: number;
    engineRunningHours: number;
    equipmentGroup: string;
    maintenancePlan: string;
    nextServiceDate: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    notes?: string;
  }) => { success: boolean; error?: string; vehicleId?: string };
  onCancel?: () => void;
  onSuccessNavigate?: (vehicleId: string) => void;
}

export const RegisterVehicleView: React.FC<RegisterVehicleViewProps> = ({
  garageName,
  onRegister,
  onCancel,
  onSuccessNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('container_truck');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('Scania');
  const [model, setModel] = useState('R 500 A6x2NA');
  const [manufacturingYear, setManufacturingYear] = useState('2024');
  const [odometer, setOdometer] = useState('25000');
  const [engineRunningHours, setEngineRunningHours] = useState('640');
  const [equipmentGroup, setEquipmentGroup] = useState('Heavy Haulage');
  const [maintenancePlan, setMaintenancePlan] = useState('Flexible Maintenance, M inspection');
  const [nextScheduledDate, setNextScheduledDate] = useState('2026-11-15');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const categories: {
    id: VehicleCategory;
    title: string;
    filename: string;
  }[] = [
    { id: 'container_truck', title: 'Container Truck', filename: 'container_truck.png' },
    { id: 'dump_truck', title: 'Dump Truck', filename: 'dump_truck.png' },
    { id: 'box_truck', title: 'Box Truck', filename: 'box_truck.png' },
    { id: 'concrete_mixer', title: 'Concrete Mixer', filename: 'concrete_mixer.png' },
    { id: 'tanker_truck', title: 'Tanker Truck', filename: 'tanker_truck.png' },
    { id: 'flatbed_trailer', title: 'Flatbed Trailer', filename: 'flatbed_trailer.png' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!registrationNumber.trim()) {
      setErrorMsg('Registration Number is required.');
      return;
    }

    const res = onRegister({
      registrationNumber: registrationNumber.trim(),
      category: selectedCategory,
      manufacturer,
      model,
      manufacturingYear: parseInt(manufacturingYear, 10) || 2024,
      odometer: parseInt(odometer, 10) || 0,
      engineRunningHours: parseInt(engineRunningHours, 10) || 0,
      equipmentGroup,
      maintenancePlan,
      nextServiceDate: nextScheduledDate,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      notes,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to register vehicle.');
    } else {
      setSuccessMsg(`Vehicle ${registrationNumber.toUpperCase()} successfully registered!`);
      if (onSuccessNavigate && res.vehicleId) {
        setTimeout(() => {
          onSuccessNavigate(res.vehicleId!);
        }, 900);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-md overflow-hidden max-w-5xl mx-auto">
      <div className="bg-[#0b1b32] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight">
            Register New Commercial Vehicle
          </h2>
          <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
            <Warehouse className="w-3.5 h-3.5 text-cyan-400" />
            <span>Central Garage: {garageName}</span>
          </p>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-800">
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* 1. Select Vehicle Category */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-2">
            1. Select Vehicle Category (Determines Default Vehicle Asset) *
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const meta = VEHICLE_CATEGORY_META[cat.id];
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? 'border-[#002f6c] bg-white ring-2 ring-[#002f6c]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-16 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0">
                    <img
                      src={meta.imagePath}
                      alt={cat.title}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {cat.title}
                    </h4>
                    <p className="text-[11px] text-blue-600 font-mono mt-0.5">
                      {cat.filename}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Registration Number (Unique) *
            </label>
            <input
              type="text"
              required
              placeholder="E.G. BVDH839DFM"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
              className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden uppercase placeholder-slate-400 font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manufacturer *
            </label>
            <input
              type="text"
              required
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vehicle Model *
            </label>
            <input
              type="text"
              required
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Manufacturing Year *
            </label>
            <input
              type="number"
              required
              value={manufacturingYear}
              onChange={(e) => setManufacturingYear(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Odometer (km) *
            </label>
            <input
              type="number"
              required
              value={odometer}
              onChange={(e) => setOdometer(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Engine Running Hours *
            </label>
            <input
              type="number"
              required
              value={engineRunningHours}
              onChange={(e) => setEngineRunningHours(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Equipment Group
            </label>
            <select
              value={equipmentGroup}
              onChange={(e) => setEquipmentGroup(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="Heavy Haulage">Heavy Haulage</option>
              <option value="SMA-AI-MODULES">SMA-AI-MODULES</option>
              <option value="Intermodal Freight">Intermodal Freight</option>
              <option value="Urban Distribution">Urban Distribution</option>
              <option value="Ready-Mix Infrastructure">Ready-Mix Infrastructure</option>
              <option value="Hazardous & Bulk Liquid">Hazardous & Bulk Liquid</option>
            </select>
          </div>
        </div>

        {/* Row 3: Maintenance Plan, Next Service Date, Single Garage */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Maintenance Plan *
            </label>
            <input
              type="text"
              required
              value={maintenancePlan}
              onChange={(e) => setMaintenancePlan(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Next Scheduled Service Date *
            </label>
            <input
              type="date"
              required
              value={nextScheduledDate}
              onChange={(e) => setNextScheduledDate(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Garage Facility (Single-Garage Mode)
            </label>
            <div className="w-full text-xs p-2 border border-slate-200 rounded bg-slate-50 text-slate-700 font-semibold flex items-center gap-2">
              <Warehouse className="w-3.5 h-3.5 text-[#0051a8] shrink-0" />
              <span className="truncate">{garageName}</span>
            </div>
          </div>
        </div>

        {/* Row 4: Customer / Fleet Owner Billing Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer / Fleet Owner Name
            </label>
            <input
              type="text"
              placeholder="e.g. Apex Earthmovers Pvt Ltd"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Contact Number
            </label>
            <input
              type="text"
              placeholder="e.g. +91 98450 00000"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Email (For Invoices)
            </label>
            <input
              type="email"
              placeholder="billing@fleetowner.in"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Additional Notes
          </label>
          <textarea
            rows={3}
            placeholder="Optional chassis notes, telemetry module IDs, or special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden placeholder-slate-400"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-[#004f9f] hover:bg-[#003d80] rounded shadow-xs transition-colors"
          >
            Register Vehicle
          </button>
        </div>
      </form>
    </div>
  );
};
