import React from 'react';
import { ServiceBooking, ServiceWorkflowColumn } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import { Info, Check, X, Play, CheckCircle2, FileText, Package, Receipt } from 'lucide-react';

interface WorkflowColumnsProps {
  bookings: ServiceBooking[];
  onSelectVehicle: (vehicleId: string) => void;
  onApprovePreliminary: (bookingId: string) => void;
  onRejectPreliminary: (bookingId: string) => void;
  onStartConfirmed: (bookingId: string) => void;
  onCompleteInProgress: (bookingId: string) => void;
  onOpenBookingWizard: (preselectedVehicleId?: string) => void;
  onOpenJobMaterials: (bookingId: string) => void;
  onOpenInvoicePreview: (bookingId: string) => void;
}

export const WorkflowColumns: React.FC<WorkflowColumnsProps> = ({
  bookings,
  onSelectVehicle,
  onApprovePreliminary,
  onRejectPreliminary,
  onStartConfirmed,
  onCompleteInProgress,
  onOpenBookingWizard,
  onOpenJobMaterials,
  onOpenInvoicePreview,
}) => {
  const columns: {
    id: ServiceWorkflowColumn;
    title: string;
    emptyText: string;
    actionHint: string;
  }[] = [
    {
      id: 'service_events_to_book',
      title: 'Service events to book',
      emptyText: 'No unbooked service events matching current filter.',
      actionHint: 'Schedule garage appointment',
    },
    {
      id: 'preliminary_bookings',
      title: 'Preliminary Bookings',
      emptyText: 'No preliminary booking requests pending approval.',
      actionHint: 'Approve or Reject proposed slot',
    },
    {
      id: 'confirmed_bookings',
      title: 'Confirmed Bookings',
      emptyText: 'No confirmed bookings found.',
      actionHint: 'Drop off vehicle & start workshop service',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      emptyText: 'No vehicles currently in workshop bay.',
      actionHint: 'Mark completed to log into Service History',
    },
  ];

  // Render status badge matching screenshot
  const renderStatusBadge = (b: ServiceBooking) => {
    switch (b.badgeType) {
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#e02424] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#e02424]" />
            <span>Delayed</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'due':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#0051a8] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0051a8]" />
            <span>Due</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'major':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#e02424] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#e02424]" />
            <span>Major</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#d97706] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>Pending</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'proposal':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#d97706] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span>Proposal</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'drop_off':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Drop off</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'pick_up':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#0051a8] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#0051a8]" />
            <span>Pick up</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
      case 'accepted':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#059669] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span>Accepted</span>
            <span className="text-slate-500 font-mono text-[10px]">{b.badgeDateStr}</span>
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {columns.map((col) => {
        const colBookings = bookings.filter((b) => b.workflowColumn === col.id);

        return (
          <div key={col.id} className="flex flex-col">
            {/* Column Header matching screenshot */}
            <div className="bg-[#e4e9f0] text-slate-800 px-3 py-2 rounded-t-md border border-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  {col.title}
                </span>
                <span className="bg-white text-slate-800 text-[11px] font-bold px-1.5 py-0.2 rounded-full font-mono shadow-2xs">
                  {colBookings.length}
                </span>
              </div>

              <div className="relative group cursor-pointer" title={col.actionHint}>
                <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-800 transition-colors" />
              </div>
            </div>

            {/* Column Body Container */}
            <div className="bg-[#f2f5f9] p-2.5 rounded-b-md border border-t-0 border-slate-200/90 min-h-[380px] space-y-2.5">
              {colBookings.length === 0 ? (
                <div className="bg-white rounded border border-slate-200/90 p-5 text-center text-xs text-slate-400 py-10 shadow-2xs">
                  {col.emptyText}
                </div>
              ) : (
                colBookings.map((b) => {
                  const meta = VEHICLE_CATEGORY_META[b.vehicleCategory];

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded border border-slate-200 p-3 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group"
                    >
                      {/* Top row: Vehicle Category Image + Reg No + Scania Crest */}
                      <div className="flex items-start gap-3 mb-2">
                        {/* Vehicle Category Image using the uploaded assets */}
                        <div
                          onClick={() => onSelectVehicle(b.vehicleId)}
                          className="w-16 h-11 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0 cursor-pointer hover:border-slate-300 transition-colors"
                          title="Click to view Vehicle Profile slide-over"
                        >
                          <img
                            src={meta.imagePath}
                            alt={meta.label}
                            referrerPolicy="no-referrer"
                            className="max-h-full max-w-full object-contain mix-blend-multiply"
                          />
                        </div>

                        {/* Reg & details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <button
                              onClick={() => onSelectVehicle(b.vehicleId)}
                              className="text-xs font-bold font-mono text-slate-900 hover:text-blue-600 transition-colors truncate tracking-tight text-left"
                            >
                              {b.vehicleReg}
                            </button>

                            {/* Scania shield emblem simulation matching screenshot */}
                            <div className="w-4 h-4 rounded-xs bg-[#001738] text-[#c9a66b] flex items-center justify-center text-[8px] font-black shrink-0 shadow-2xs" title="Scania Certified Unit">
                              S
                            </div>
                          </div>

                          <p className="text-[11px] font-semibold text-slate-700 leading-snug line-clamp-1 mt-0.5">
                            {b.serviceActivities}
                          </p>

                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {b.workshopLocation}
                          </p>
                        </div>
                      </div>

                      {/* Footer: Status badge & specific column actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                        <div>{renderStatusBadge(b)}</div>

                        {/* Interactive Column Actions */}
                        <div className="flex items-center gap-1">
                          {/* Column 1: Book Service CTA */}
                          {col.id === 'service_events_to_book' && (
                            <button
                              onClick={() => onOpenBookingWizard(b.vehicleId)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors"
                              title="Book service slot for vehicle"
                            >
                              Book slot
                            </button>
                          )}

                          {/* Column 2: Approve & Reject Actions */}
                          {col.id === 'preliminary_bookings' && (
                            <>
                              <button
                                onClick={() => onApprovePreliminary(b.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-white hover:bg-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition-colors shadow-2xs"
                                title="Approve proposed booking"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => onRejectPreliminary(b.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Reject proposal"
                                aria-label="Reject booking"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Column 3: Start Service Action */}
                          {col.id === 'confirmed_bookings' && (
                            <button
                              onClick={() => onStartConfirmed(b.id)}
                              className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#0051a8] hover:bg-[#003d80] px-2.5 py-1 rounded transition-colors shadow-2xs"
                              title="Start workshop bay service"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Start</span>
                            </button>
                          )}

                          {/* Column 4: Materials, Invoice & Mark Completed Actions */}
                          {col.id === 'in_progress' && (
                            <>
                              <button
                                onClick={() => onOpenJobMaterials(b.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-[#0051a8] hover:bg-blue-50 bg-white px-2 py-1 rounded border border-blue-200 transition-colors"
                                title="Log Actual & Additional Spare Parts Used"
                              >
                                <Package className="w-3 h-3" />
                                <span>Parts</span>
                              </button>
                              <button
                                onClick={() => onOpenInvoicePreview(b.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#166534] hover:bg-[#14532d] px-2 py-1 rounded transition-colors shadow-2xs"
                                title="Preview & Generate Final Invoice (Deducts Stock)"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Invoice</span>
                              </button>
                              <button
                                onClick={() => onCompleteInProgress(b.id)}
                                className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-white hover:bg-emerald-600 bg-emerald-100 px-2 py-1 rounded border border-emerald-300 transition-colors shadow-2xs"
                                title="Mark as completed & log into vehicle history"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            </>
                          )}

                          {/* Parts/Estimate inspection for other columns */}
                          {col.id !== 'in_progress' && (
                            <button
                              onClick={() => onOpenJobMaterials(b.id)}
                              className="p-1 text-slate-400 hover:text-[#0051a8] rounded transition-colors"
                              title="View Preliminary Material Estimate & Parts"
                              aria-label="View estimated materials"
                            >
                              <Package className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Document inspection trigger */}
                          <button
                            onClick={() => onSelectVehicle(b.vehicleId)}
                            className="p-1 text-slate-300 hover:text-slate-600 rounded transition-colors"
                            title="Inspect Vehicle Telemetry"
                            aria-label="Inspect vehicle"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
