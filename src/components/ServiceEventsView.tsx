import React, { useState } from 'react';
import { ServiceBooking } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import { Search, Plus, Package, Receipt } from 'lucide-react';

interface ServiceEventsViewProps {
  bookings: ServiceBooking[];
  onSelectVehicle: (vehicleId: string) => void;
  onOpenBookingWizard: (preselectedVehicleId?: string) => void;
  onApprovePreliminary: (bookingId: string) => void;
  onStartConfirmed: (bookingId: string) => void;
  onCompleteInProgress: (bookingId: string) => void;
  onOpenJobMaterials: (bookingId: string) => void;
  onOpenInvoicePreview: (bookingId: string) => void;
}

export const ServiceEventsView: React.FC<ServiceEventsViewProps> = ({
  bookings,
  onSelectVehicle,
  onOpenBookingWizard,
  onApprovePreliminary,
  onStartConfirmed,
  onCompleteInProgress,
  onOpenJobMaterials,
  onOpenInvoicePreview,
}) => {
  const [search, setSearch] = useState('');
  const [columnFilter, setColumnFilter] = useState('all');

  const filtered = bookings.filter((b) => {
    const matchesCol = columnFilter === 'all' || b.workflowColumn === columnFilter;
    const matchesSearch =
      search.trim() === '' ||
      b.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
      b.serviceActivities.toLowerCase().includes(search.toLowerCase()) ||
      b.workshopLocation.toLowerCase().includes(search.toLowerCase());

    return matchesCol && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Service Events & Work Orders
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete database of planned inspections, preliminary requests, and active bay sessions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search registration, workshop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-xs py-2 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-52 sm:w-64"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => onOpenBookingWizard()}
            className="flex items-center gap-1.5 bg-[#0051a8] hover:bg-[#003d80] text-white text-xs font-bold px-3.5 py-2 rounded shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book a Service</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-2 overflow-x-auto">
        {[
          { id: 'all', label: `All Events (${bookings.length})` },
          { id: 'service_events_to_book', label: 'Unbooked Events' },
          { id: 'preliminary_bookings', label: 'Preliminary Bookings' },
          { id: 'confirmed_bookings', label: 'Confirmed Bookings' },
          { id: 'in_progress', label: 'In Progress' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setColumnFilter(tab.id)}
            className={`py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
              columnFilter === tab.id
                ? 'border-blue-600 text-blue-700 font-bold bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table view */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-2.5 px-3">Vehicle</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Service Details</th>
              <th className="py-2.5 px-3">Workshop</th>
              <th className="py-2.5 px-3">Scheduled Slot</th>
              <th className="py-2.5 px-3">Workflow Column</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => {
              const meta = VEHICLE_CATEGORY_META[b.vehicleCategory];

              return (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-3">
                    <button
                      onClick={() => onSelectVehicle(b.vehicleId)}
                      className="font-mono font-bold text-slate-900 hover:text-blue-600 text-left block"
                    >
                      {b.vehicleReg}
                    </button>
                    <span className="text-[10px] text-slate-400 font-mono">#{b.bookingRef}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-0.5">
                        <img
                          src={meta.imagePath}
                          alt={meta.label}
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <span className="text-slate-700 font-medium">{meta.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 max-w-xs">
                    <div className="font-semibold text-slate-800 truncate">{b.serviceActivities}</div>
                    <div className="text-[11px] text-slate-400">{b.equipmentGroup}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{b.workshopLocation}</td>
                  <td className="py-3 px-3 font-mono">
                    <div className="text-slate-800 font-medium">{b.date}</div>
                    <div className="text-[10px] text-slate-400">
                      {b.startTime} - {b.endTime}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                      {b.workflowColumn.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenJobMaterials(b.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded border border-slate-200"
                        title="Manage Service Materials"
                      >
                        <Package className="w-3 h-3" />
                        <span>Parts</span>
                      </button>
                      {(b.workflowColumn === 'in_progress' || b.invoiceStatus === 'generated') && (
                        <button
                          onClick={() => onOpenInvoicePreview(b.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] px-2 py-1 rounded"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>{b.invoiceNumber || 'Invoice'}</span>
                        </button>
                      )}
                      {b.workflowColumn === 'preliminary_bookings' && (
                        <button
                          onClick={() => onApprovePreliminary(b.id)}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200"
                        >
                          Approve
                        </button>
                      )}
                      {b.workflowColumn === 'confirmed_bookings' && (
                        <button
                          onClick={() => onStartConfirmed(b.id)}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow-2xs"
                        >
                          Start
                        </button>
                      )}
                      {b.workflowColumn === 'in_progress' && (
                        <button
                          onClick={() => onCompleteInProgress(b.id)}
                          className="text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded border border-emerald-300"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
