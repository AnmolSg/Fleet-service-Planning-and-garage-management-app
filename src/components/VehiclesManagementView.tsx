import React, { useState } from 'react';
import { Vehicle, VehicleCategory } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import { Plus, Search, Truck, Gauge, Clock, Wrench, ChevronRight } from 'lucide-react';

interface VehiclesManagementViewProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicleId: string) => void;
  onOpenBookingWizard: (preselectedVehicleId?: string) => void;
  onNavigateAddVehicle?: () => void;
}

export const VehiclesManagementView: React.FC<VehiclesManagementViewProps> = ({
  vehicles,
  onSelectVehicle,
  onOpenBookingWizard,
  onNavigateAddVehicle,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | VehicleCategory>('all');
  const [search, setSearch] = useState('');

  const categories: { id: 'all' | VehicleCategory; label: string }[] = [
    { id: 'all', label: 'All Fleet Categories' },
    { id: 'box_truck', label: 'Box Truck' },
    { id: 'container_truck', label: 'Container Truck' },
    { id: 'dump_truck', label: 'Dump Truck' },
    { id: 'concrete_mixer', label: 'Concrete Mixer' },
    { id: 'flatbed_trailer', label: 'Flatbed Trailer' },
    { id: 'tanker_truck', label: 'Tanker Truck' },
  ];

  const filteredVehicles = vehicles.filter((v) => {
    const matchesCategory = categoryFilter === 'all' || v.category === categoryFilter;
    const matchesSearch =
      search.trim() === '' ||
      v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      v.equipmentGroup.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Vehicles Fleet Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active telemetry and service lifecycle across the 6 calibrated vehicle categories
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search registration or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-xs py-2 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-52 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => onOpenBookingWizard()}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold px-3 py-2 rounded shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book a Service</span>
          </button>

          {onNavigateAddVehicle && (
            <button
              onClick={onNavigateAddVehicle}
              className="flex items-center gap-1.5 bg-[#0051a8] hover:bg-[#003d80] text-white text-xs font-bold px-3.5 py-2 rounded shadow-2xs transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Register Vehicle</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Category Filter Bar with Image Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {categories.map((cat) => {
          const isSelected = categoryFilter === cat.id;
          const meta = cat.id !== 'all' ? VEHICLE_CATEGORY_META[cat.id] : null;

          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="h-8 flex items-center justify-center mb-1">
                {meta ? (
                  <img
                    src={meta.imagePath}
                    alt={meta.label}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                ) : (
                  <Truck className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <span className="text-[11px] font-bold text-slate-800 truncate">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Vehicles Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles.map((v) => {
          const meta = VEHICLE_CATEGORY_META[v.category];
          const delayedCount = v.maintenanceChecklist.filter((m) => m.status === 'delayed').length;
          const repairCount = v.repairChecklist.filter((r) => !r.resolved).length;

          return (
            <div
              key={v.id}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with image, registration, model */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    onClick={() => onSelectVehicle(v.id)}
                    className="w-20 h-14 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 cursor-pointer hover:border-slate-300"
                  >
                    <img
                      src={meta.imagePath}
                      alt={meta.label}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSelectVehicle(v.id)}
                        className="text-sm font-bold font-mono text-slate-900 hover:text-blue-600 transition-colors tracking-tight"
                      >
                        {v.registrationNumber}
                      </button>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                        {meta.label}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{v.model}</p>
                    <p className="text-[11px] font-mono text-slate-400">{v.equipmentGroup}</p>
                  </div>
                </div>

                {/* Telemetry quick stats */}
                <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 text-[11px] mb-3">
                  <div>
                    <span className="text-slate-400 block">Odometer</span>
                    <span className="font-mono font-bold text-slate-800">
                      {v.odometer.toLocaleString()} km
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Next Service</span>
                    <span className="font-mono font-bold text-slate-800">
                      {v.nextServiceDate}
                    </span>
                  </div>
                </div>

                {/* Maintenance health indicators */}
                <div className="flex items-center gap-2 mb-2">
                  {delayedCount > 0 && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {delayedCount} Delayed Activities
                    </span>
                  )}
                  {repairCount > 0 && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {repairCount} Repairs Pending
                    </span>
                  )}
                  {delayedCount === 0 && repairCount === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Fully In Service
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onSelectVehicle(v.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <span>Vehicle Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenBookingWizard(v.id)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                >
                  Book Service
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
