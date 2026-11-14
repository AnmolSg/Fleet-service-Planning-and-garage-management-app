import React, { useState } from 'react';
import { GarageConfig, ServiceBooking, Vehicle } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  History,
  ExternalLink,
  Package,
  Receipt,
  Wrench,
} from 'lucide-react';

interface VehicleProfileSlideOverProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  bookings: ServiceBooking[];
  garageConfig: GarageConfig;
  onAddUnplannedActivity: (vehicleId: string, name: string) => void;
  onAddUnplannedRepair: (
    vehicleId: string,
    issue: string,
    severity: 'major' | 'minor' | 'critical'
  ) => void;
  onOpenBookingWizard: (preselectedVehicleId?: string) => void;
  onOpenJobMaterials: (bookingId: string) => void;
  onOpenInvoicePreview: (bookingId: string) => void;
}

export const VehicleProfileSlideOver: React.FC<VehicleProfileSlideOverProps> = ({
  vehicle,
  onClose,
  bookings,
  garageConfig,
  onAddUnplannedActivity,
  onAddUnplannedRepair,
  onOpenBookingWizard,
  onOpenJobMaterials,
  onOpenInvoicePreview,
}) => {
  const [isBookingsExpanded, setIsBookingsExpanded] = useState(true);
  const [isConsumptionExpanded, setIsConsumptionExpanded] = useState(true);
  const [isAddActivityModalOpen, setIsAddActivityModalOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [isAddRepairModalOpen, setIsAddRepairModalOpen] = useState(false);
  const [newRepairIssue, setNewRepairIssue] = useState('');
  const [newRepairSeverity, setNewRepairSeverity] = useState<'major' | 'minor' | 'critical'>(
    'major'
  );

  const [checkedMaintenance, setCheckedMaintenance] = useState<Record<string, boolean>>({});
  const [checkedRepairs, setCheckedRepairs] = useState<Record<string, boolean>>({});

  if (!vehicle) return null;

  const meta = VEHICLE_CATEGORY_META[vehicle.category];
  const vehicleBookings = bookings.filter((b) => b.vehicleId === vehicle.id);
  const activeJob =
    vehicleBookings.find((b) => b.workflowColumn === 'in_progress') ||
    vehicleBookings.find((b) => b.workflowColumn === 'confirmed_bookings') ||
    vehicleBookings[0] ||
    null;

  const toggleMaintenance = (id: string) => {
    setCheckedMaintenance((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRepair = (id: string) => {
    setCheckedRepairs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;
    onAddUnplannedActivity(vehicle.id, newActivityName.trim());
    setNewActivityName('');
    setIsAddActivityModalOpen(false);
  };

  const handleAddRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepairIssue.trim()) return;
    onAddUnplannedRepair(vehicle.id, newRepairIssue.trim(), newRepairSeverity);
    setNewRepairIssue('');
    setIsAddRepairModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-2xs flex justify-end">
      <div className="w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-24 h-16 rounded bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0">
                <img
                  src={meta.imagePath}
                  alt={meta.label}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold font-mono text-slate-900 tracking-tight">
                  {vehicle.registrationNumber}
                </h2>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">{vehicle.model}</p>
                <p className="text-xs font-mono text-slate-400">
                  {vehicle.equipmentGroup} · {meta.label}
                </p>
                {vehicle.customerName && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customer: <span className="font-semibold text-slate-700">{vehicle.customerName}</span> ({vehicle.customerPhone || '-'})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenBookingWizard(vehicle.id)}
                className="text-xs font-bold bg-[#0051a8] hover:bg-[#003d80] text-white px-3 py-1.5 rounded transition-colors shadow-2xs whitespace-nowrap"
              >
                + Book Service
              </button>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded hover:bg-slate-100 transition-colors"
                aria-label="Close slide-over"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Telemetry Block */}
          <div className="p-6 bg-slate-50/70 border-b border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Odometer</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {vehicle.odometer.toLocaleString()} km
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Engine Running Time</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {vehicle.engineRunningHours} hours
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Next service</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {vehicle.nextServiceDate}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-medium block mb-0.5">Maintenance Plan</span>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
                >
                  <span>{vehicle.maintenancePlan}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-0.5">Garage</span>
                <span className="font-semibold text-slate-700">{garageConfig.garageName}</span>
              </div>
            </div>
          </div>

          {/* DEDICATED SECTION: Service Material Consumption (A, B, C) */}
          <div className="border-b border-slate-200">
            <button
              onClick={() => setIsConsumptionExpanded(!isConsumptionExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#0051a8]" />
                <h3 className="text-sm font-bold text-slate-900">Service Material Consumption</h3>
                {activeJob && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    #{activeJob.bookingRef}
                  </span>
                )}
              </div>
              {isConsumptionExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isConsumptionExpanded && (
              <div className="px-6 pb-5 space-y-3 text-xs">
                {!activeJob ? (
                  <p className="text-slate-400 py-1">
                    No active repair job for this vehicle. Book a service to generate a preliminary material estimate.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-900">{activeJob.serviceType}</p>
                        <p className="text-[11px] text-slate-500">
                          {activeJob.invoiceStatus === 'generated'
                            ? `Billed via ${activeJob.invoiceNumber} (Stock Deducted)`
                            : 'Zero stock deduction until final invoice is generated'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenJobMaterials(activeJob.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#0051a8] hover:bg-[#003d80] rounded"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Edit Materials</span>
                        </button>
                        <button
                          onClick={() => onOpenInvoicePreview(activeJob.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>
                            {activeJob.invoiceStatus === 'generated'
                              ? 'View Invoice'
                              : 'Generate Invoice'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* A. Estimated Materials */}
                    <div className="border border-slate-200 rounded p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        A. Estimated Materials ({activeJob.estimatedMaterials?.length || 0})
                      </p>
                      {(activeJob.estimatedMaterials || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">None pre-estimated.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeJob.estimatedMaterials.map((em) => (
                            <span
                              key={em.id}
                              className="text-[11px] font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded"
                            >
                              {em.partName}: {em.estimatedQuantity} {em.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* B. Actual Materials Used */}
                    <div className="border border-slate-200 rounded p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        B. Actual Materials Used ({activeJob.actualMaterials?.length || 0})
                      </p>
                      {(activeJob.actualMaterials || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">No actual usage recorded yet.</p>
                      ) : (
                        <div className="space-y-1">
                          {activeJob.actualMaterials.map((am) => (
                            <div
                              key={am.id}
                              className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0"
                            >
                              <span className="font-medium text-slate-800">{am.partName}</span>
                              <span className="font-mono font-bold text-slate-900">
                                {am.actualQuantity} {am.unit} (Est: {am.estimatedQuantity})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* C. Additional Materials */}
                    <div className="border border-slate-200 rounded p-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        C. Additional Materials ({activeJob.additionalMaterials?.length || 0})
                      </p>
                      {(activeJob.additionalMaterials || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">
                          No unplanned parts added. Click &ldquo;Edit Materials&rdquo; to log extra parts.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {activeJob.additionalMaterials.map((ad) => (
                            <div
                              key={ad.id}
                              className="flex items-center justify-between text-[11px] py-0.5 border-b border-slate-100 last:border-0"
                            >
                              <div>
                                <span className="font-medium text-slate-800">{ad.partName}</span>
                                <span className="text-[10px] text-slate-500 ml-1.5">
                                  ({ad.reason})
                                </span>
                              </div>
                              <span className="font-mono font-bold text-amber-800">
                                +{ad.quantity} {ad.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Expandable Bookings Accordion */}
          <div className="border-b border-slate-200">
            <button
              onClick={() => setIsBookingsExpanded(!isBookingsExpanded)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Bookings</h3>
                <span className="bg-slate-100 text-slate-700 text-xs font-mono font-bold px-2 py-0.5 rounded-full">
                  {vehicleBookings.length}
                </span>
              </div>
              {isBookingsExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isBookingsExpanded && (
              <div className="px-6 pb-4 space-y-2">
                {vehicleBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No active bookings for this vehicle.</p>
                ) : (
                  vehicleBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-3 bg-white rounded border border-slate-200 flex items-center justify-between shadow-2xs gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{bk.bookingRef}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 truncate">
                            {bk.serviceActivities}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {bk.workshopLocation} · {bk.date} ({bk.startTime} - {bk.endTime})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onOpenJobMaterials(bk.id)}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Materials
                        </button>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {bk.workflowColumn.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Maintenance Checklist */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Maintenance</h3>
              <button
                onClick={() => setIsAddActivityModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-300 hover:border-slate-400 bg-white transition-colors shadow-2xs"
              >
                <span>Add an unplanned activity</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {vehicle.maintenanceChecklist.map((item) => {
                const isChecked = checkedMaintenance[item.id] || false;
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleMaintenance(item.id)}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium transition-colors ${
                          isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[11px] text-[#e02424] font-semibold bg-rose-50 px-2 py-0.5 rounded">
                      <span className="w-2 h-2 rounded-full bg-[#e02424]" />
                      <span>{item.status}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {item.dueDate}
                        {item.dueTime ? `, ${item.dueTime}` : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Repair Checklist */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Repair</h3>
              <button
                onClick={() => setIsAddRepairModalOpen(true)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-slate-900 px-3 py-1.5 rounded border border-slate-300 hover:border-slate-400 bg-white transition-colors shadow-2xs"
              >
                <span>Add an unplanned repair</span>
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {vehicle.repairChecklist.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">No active repairs logged.</p>
              ) : (
                vehicle.repairChecklist.map((rep) => {
                  const isChecked = checkedRepairs[rep.id] || false;
                  return (
                    <div
                      key={rep.id}
                      onClick={() => toggleRepair(rep.id)}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span
                          className={`text-xs font-medium transition-colors ${
                            isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {rep.issue}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#e02424] font-semibold bg-rose-50 px-2 py-0.5 rounded">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                        <span className="capitalize">{rep.severity}</span>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {rep.reportedDate}, {rep.reportedTime}
                        </span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Service History */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Service History</span>
            </h3>

            {vehicle.serviceHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No recorded completed services yet.</p>
            ) : (
              <div className="space-y-3">
                {vehicle.serviceHistory.map((hist) => (
                  <div key={hist.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{hist.serviceTitle}</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {hist.completedDate}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{hist.notes}</p>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-200 text-[11px] text-slate-500">
                      <span>
                        {hist.workshopLocation} · {hist.performedBy}
                        {hist.invoiceNumber ? ` · ${hist.invoiceNumber}` : ''}
                      </span>
                      <span className="font-mono font-bold text-slate-800">{hist.costEstimate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#001738] text-[#c9a66b] flex items-center justify-center text-[10px] font-black shadow-xs">
              G
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              {garageConfig.garageName}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50"
          >
            Close Panel
          </button>
        </div>
      </div>

      {/* Add Unplanned Activity Modal */}
      {isAddActivityModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-5 max-w-md w-full">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Add Unplanned Activity</h4>
            <form onSubmit={handleAddActivitySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Activity Name / Inspection Point
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brake pad wear sensor recalibration"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddActivityModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-500"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unplanned Repair Modal */}
      {isAddRepairModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-5 max-w-md w-full">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Add Unplanned Repair</h4>
            <form onSubmit={handleAddRepairSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Defect / Symptom Issue
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Coolant reservoir slow pressure drop"
                  value={newRepairIssue}
                  onChange={(e) => setNewRepairIssue(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Severity Level
                </label>
                <select
                  value={newRepairSeverity}
                  onChange={(e) => setNewRepairSeverity(e.target.value as any)}
                  className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                >
                  <option value="major">Major (Delayed / Immediate)</option>
                  <option value="critical">Critical (Workshop Bay Grounded)</option>
                  <option value="minor">Minor (Monitor during next oil swap)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRepairModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-500"
                >
                  Add Repair Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
