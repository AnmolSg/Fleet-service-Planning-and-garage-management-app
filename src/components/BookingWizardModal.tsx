import React, { useState, useEffect } from 'react';
import {
  GarageConfig,
  InventoryItem,
  JobEstimatedMaterialLine,
  ServiceBooking,
  ServiceTemplate,
  Supplier,
  Vehicle,
} from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Wrench,
  AlertTriangle,
  Clock,
  Warehouse,
  Package,
  Plus,
  Trash2,
  Phone,
  ShieldAlert,
} from 'lucide-react';

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  garageConfig: GarageConfig;
  serviceTemplates: ServiceTemplate[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  buildEstimateFromTemplate: (serviceTypeName: string) => {
    estimatedMaterials: JobEstimatedMaterialLine[];
    defaultLabour: number;
  };
  preselectedVehicleId?: string;
  prefillDate?: string;
  prefillStartTime?: string;
  onCreateBooking: (
    booking: Omit<
      ServiceBooking,
      | 'id'
      | 'bookingRef'
      | 'actualMaterials'
      | 'additionalMaterials'
      | 'additionalServiceCharges'
      | 'discountAmount'
    > & {
      estimatedMaterials?: JobEstimatedMaterialLine[];
      labourCharges?: number;
    }
  ) => { success: boolean; error?: string };
}

export const BookingWizardModal: React.FC<BookingWizardModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  garageConfig,
  serviceTemplates,
  inventory,
  suppliers,
  buildEstimateFromTemplate,
  preselectedVehicleId,
  prefillDate,
  prefillStartTime,
  onCreateBooking,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    () => preselectedVehicleId || vehicles[0]?.id || ''
  );
  const [selectedServiceType, setSelectedServiceType] = useState<string>(
    () => serviceTemplates[0]?.name || 'General Service'
  );
  const [selectedActivities, setSelectedActivities] = useState<string[]>([
    'Flexible Maintenance',
    'M Inspection',
  ]);
  const [estimatedMaterials, setEstimatedMaterials] = useState<JobEstimatedMaterialLine[]>([]);
  const [estimatedLabour, setEstimatedLabour] = useState<number>(1800);
  const [addPartId, setAddPartId] = useState<string>('');
  const [addPartQty, setAddPartQty] = useState<string>('1');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [date, setDate] = useState(() => prefillDate || '2023-09-27');
  const [startTime, setStartTime] = useState(() => prefillStartTime || '08:00');
  const [endTime, setEndTime] = useState(() => {
    if (prefillStartTime) {
      const [h, m] = prefillStartTime.split(':').map(Number);
      const endH = Math.min(17, h + 3);
      return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return '11:30';
  });
  const [unplannedNotes, setUnplannedNotes] = useState('');
  const [conflictError, setConflictError] = useState<string | null>(null);

  // Sync prefill when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setCurrentStep(1);
    setConflictError(null);
    const vId = preselectedVehicleId || vehicles[0]?.id || '';
    setSelectedVehicleId(vId);
    const veh = vehicles.find((v) => v.id === vId);
    if (veh) {
      setCustomerName(veh.customerName || '');
      setCustomerPhone(veh.customerPhone || '');
      setCustomerEmail(veh.customerEmail || '');
    }
    if (prefillDate) setDate(prefillDate);
    if (prefillStartTime) {
      setStartTime(prefillStartTime);
      const [h, m] = prefillStartTime.split(':').map(Number);
      const endH = Math.min(17, h + 3);
      setEndTime(`${String(endH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
    }
    const defaultType = serviceTemplates[0]?.name || 'General Service';
    setSelectedServiceType(defaultType);
    const est = buildEstimateFromTemplate(defaultType);
    setEstimatedMaterials(est.estimatedMaterials);
    setEstimatedLabour(est.defaultLabour);
  }, [isOpen, preselectedVehicleId, prefillDate, prefillStartTime]);

  if (!isOpen) return null;

  const currentVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const activeInventoryItems = inventory.filter((i) => i.isActive);

  const handleVehicleSelect = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
    setCustomerName(v.customerName || '');
    setCustomerPhone(v.customerPhone || '');
    setCustomerEmail(v.customerEmail || '');
  };

  const handleSelectServiceType = (typeName: string) => {
    setSelectedServiceType(typeName);
    const est = buildEstimateFromTemplate(typeName);
    setEstimatedMaterials(est.estimatedMaterials);
    setEstimatedLabour(est.defaultLabour);
  };

  const handleUpdateEstQty = (lineId: string, qtyVal: number) => {
    setEstimatedMaterials((prev) =>
      prev.map((m) =>
        m.id === lineId ? { ...m, estimatedQuantity: Math.max(0, Math.round(qtyVal * 100) / 100) } : m
      )
    );
  };

  const handleRemoveEstLine = (lineId: string) => {
    setEstimatedMaterials((prev) => prev.filter((m) => m.id !== lineId));
  };

  const handleAddEstPart = () => {
    const targetId = addPartId || activeInventoryItems[0]?.id;
    const inv = activeInventoryItems.find((i) => i.id === targetId);
    const qty = Math.max(0.1, Math.round((parseFloat(addPartQty) || 1) * 100) / 100);
    if (!inv) return;

    const existing = estimatedMaterials.find((m) => m.inventoryItemId === inv.id);
    if (existing) {
      handleUpdateEstQty(existing.id, existing.estimatedQuantity + qty);
    } else {
      setEstimatedMaterials((prev) => [
        ...prev,
        {
          id: `est-${Date.now()}`,
          inventoryItemId: inv.id,
          partName: inv.partName,
          sku: inv.sku,
          unit: inv.unit,
          estimatedQuantity: qty,
          unitPrice: inv.sellingPrice,
        },
      ]);
    }
    setAddPartQty('1');
  };

  const toggleActivity = (svc: string) => {
    setSelectedActivities((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleNextStep = () => {
    if (currentStep === 4 && startTime >= endTime) {
      setConflictError('End time must be after start time.');
      return;
    }
    setConflictError(null);
    setCurrentStep((s) => Math.min(6, s + 1));
  };

  const handlePrevStep = () => {
    setConflictError(null);
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle) return;

    const activitySummary =
      selectedActivities.length > 0
        ? `${selectedServiceType} — ${selectedActivities.join(', ')}`
        : selectedServiceType;

    const res = onCreateBooking({
      vehicleId: currentVehicle.id,
      vehicleReg: currentVehicle.registrationNumber,
      vehicleCategory: currentVehicle.category,
      vehicleModel: currentVehicle.model,
      equipmentGroup: currentVehicle.equipmentGroup,
      title: `${currentVehicle.registrationNumber} ${selectedServiceType}`,
      serviceType: selectedServiceType,
      serviceActivities: activitySummary,
      workshopLocation: garageConfig.garageName,
      workflowColumn: 'preliminary_bookings',
      calendarStatus: 'preliminary',
      date,
      startTime,
      endTime,
      badgeType: 'pending',
      badgeDateStr: `${date}, ${startTime}`,
      notes: unplannedNotes,
      customerName: customerName.trim() || currentVehicle.customerName || 'Fleet Customer',
      customerPhone: customerPhone.trim() || currentVehicle.customerPhone || '-',
      customerEmail: customerEmail.trim() || currentVehicle.customerEmail || '',
      estimatedMaterials: estimatedMaterials.filter((m) => m.estimatedQuantity > 0),
      labourCharges: estimatedLabour,
    });

    if (!res.success) {
      setConflictError(res.error || 'Failed to create booking due to schedule conflict.');
      setCurrentStep(4);
      return;
    }

    onClose();
  };

  const availablePackages = [
    { id: 'Flexible Maintenance', desc: 'Standard engine, oil, filter & diagnostics service' },
    { id: 'M Inspection', desc: 'Mandatory chassis, steering, and suspension stress audit' },
    { id: 'X Inspection', desc: 'Emission control, exhaust aftertreatment, and brake test' },
    { id: 'Tail Lift & Hydraulics', desc: 'Cylinder pressure test and fluid seal overhaul' },
  ];

  const stepTitles = [
    'Vehicle Selection',
    'Service Type & Garage',
    'Material Estimate',
    'Date & Time Slot',
    'Customer & Notes',
    'Review & Submit',
  ];

  const estimatedPartsTotal = estimatedMaterials.reduce(
    (sum, m) => sum + m.estimatedQuantity * m.unitPrice,
    0
  );

  // Stock analysis across estimated items
  const stockAnalysis = estimatedMaterials.map((em) => {
    const inv = inventory.find((i) => i.id === em.inventoryItemId);
    const available = inv?.quantityOnHand ?? 0;
    const minStock = inv?.minimumStock ?? 0;
    const shortage = Math.max(0, Math.round((em.estimatedQuantity - available) * 100) / 100);
    const supplier = suppliers.find((s) => s.id === inv?.supplierId);

    let availabilityState: 'sufficient' | 'low' | 'insufficient' = 'sufficient';
    if (available < em.estimatedQuantity) {
      availabilityState = 'insufficient';
    } else if (available - em.estimatedQuantity < minStock || available < minStock) {
      availabilityState = 'low';
    }

    return {
      ...em,
      available,
      shortage,
      availabilityState,
      supplierName: supplier?.name || inv?.supplierName || '-',
      supplierPhone: supplier?.mobile || '-',
    };
  });

  const hasInsufficient = stockAnalysis.some((s) => s.availabilityState === 'insufficient');
  const hasLowWarning = stockAnalysis.some((s) => s.availabilityState === 'low');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="bg-[#071322] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0051a8] text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">
                6-STEP SERVICE BOOKING & MATERIAL ESTIMATION
              </h3>
              <p className="text-[11px] text-slate-400">
                Step {currentStep} of 6: {stepTitles[currentStep - 1]}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div
                key={title}
                className={`flex items-center gap-1.5 ${
                  isCurrent
                    ? 'text-blue-700 font-bold'
                    : isDone
                    ? 'text-emerald-700 font-medium'
                    : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </span>
                <span className="hidden md:inline">{title.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {conflictError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Booking Conflict Detected</p>
                <p className="mt-0.5 leading-snug">{conflictError}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Select Vehicle */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  1. Select Target Fleet Vehicle
                </h4>
                <p className="text-slate-500 mb-3">
                  Choose from the 6 calibrated vehicle categories in {garageConfig.garageName}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.map((v) => {
                  const meta = VEHICLE_CATEGORY_META[v.category];
                  const isSelected = selectedVehicleId === v.id;

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleVehicleSelect(v)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#0051a8] bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="w-16 h-12 rounded bg-slate-50 border border-slate-100 flex items-center justify-center p-1 shrink-0">
                        <img
                          src={meta.imagePath}
                          alt={meta.label}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain mix-blend-multiply"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-mono text-slate-900 text-xs">
                            {v.registrationNumber}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {v.odometer.toLocaleString()} km
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-700 truncate">
                          {v.model}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {meta.label} · {v.equipmentGroup}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Service Type Template Selection (Single-Garage Architecture) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Warehouse className="w-4 h-4 text-[#0051a8]" />
                  <div>
                    <p className="font-bold text-slate-900">{garageConfig.garageName}</p>
                    <p className="text-[11px] text-slate-500">{garageConfig.address}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Single Garage Active
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  2. Select Service Type (Auto-Predicts Spare Parts)
                </h4>
                <p className="text-slate-500 mb-3">
                  Selecting a service type loads its default spare-parts bill of materials and base labour estimate.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {serviceTemplates.map((tpl) => {
                  const isSelected = selectedServiceType === tpl.name;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectServiceType(tpl.name)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#0051a8] bg-blue-50/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900">{tpl.name}</h5>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          {garageConfig.currencySymbol}
                          {tpl.defaultLabourCharge.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {tpl.description}
                      </p>
                      <p className="text-[10px] font-mono text-blue-700 mt-1.5 font-semibold">
                        {tpl.materials.length} template part{tpl.materials.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase mb-2">
                  Additional Inspection Activities
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availablePackages.map((svc) => {
                    const isChecked = selectedActivities.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`p-2.5 rounded border cursor-pointer flex items-start gap-2.5 ${
                          isChecked
                            ? 'border-blue-500 bg-blue-50/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleActivity(svc.id)}
                          className="mt-0.5 rounded border-slate-300 text-blue-600"
                        />
                        <div>
                          <div className="font-semibold text-slate-800">{svc.id}</div>
                          <div className="text-[10px] text-slate-500">{svc.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preliminary Material Estimation & Stock Comparison */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    3. Preliminary Spare-Parts Estimate ({selectedServiceType})
                  </h4>
                  <p className="text-slate-500">
                    Review estimated quantities against live garage stock before work begins.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-1 rounded">
                  <Package className="w-3.5 h-3.5" />
                  <span>Estimation only — Zero stock deduction</span>
                </span>
              </div>

              {(hasInsufficient || hasLowWarning) && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    hasInsufficient
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <ShieldAlert
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      hasInsufficient ? 'text-rose-600' : 'text-amber-600'
                    }`}
                  />
                  <div>
                    <p className="font-bold">
                      {hasInsufficient
                        ? 'Insufficient Inventory Warning'
                        : 'Low Stock Threshold Warning'}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {hasInsufficient
                        ? 'One or more estimated parts exceed current stock on hand. You may still book this service, and order parts from the listed supplier before invoice generation.'
                        : 'Fulfilling this estimate will leave stock below minimum threshold. Consider replenishing soon.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimated Parts Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Part / SKU</th>
                      <th className="py-2 px-3 text-right">Estimated Qty</th>
                      <th className="py-2 px-3 text-right">Available</th>
                      <th className="py-2 px-3">Stock Check</th>
                      <th className="py-2 px-3 text-right">Est. Subtotal</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockAnalysis.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-5 text-center text-slate-400">
                          No template materials pre-selected. Add parts below or continue with labour only.
                        </td>
                      </tr>
                    ) : (
                      stockAnalysis.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900">{row.partName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{row.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={row.estimatedQuantity}
                                onChange={(e) =>
                                  handleUpdateEstQty(row.id, parseFloat(e.target.value) || 0)
                                }
                                className="w-16 text-right font-mono font-bold p-1 border border-slate-300 rounded bg-white"
                              />
                              <span className="text-[11px] text-slate-500 w-12 text-left">
                                {row.unit}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                            {row.available} {row.unit}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.availabilityState === 'sufficient' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Sufficient Stock
                              </span>
                            )}
                            {row.availabilityState === 'low' && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  Low Stock Warning
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>
                                    {row.supplierName} ({row.supplierPhone})
                                  </span>
                                </div>
                              </div>
                            )}
                            {row.availabilityState === 'insufficient' && (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Short by {row.shortage} {row.unit}
                                </span>
                                <div className="text-[10px] text-rose-700 mt-0.5 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>
                                    {row.supplierName} ({row.supplierPhone})
                                  </span>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {garageConfig.currencySymbol}
                            {(row.estimatedQuantity * row.unitPrice).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveEstLine(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Remove item from estimate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add another part to estimate */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-end gap-2.5">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Add Part to Estimate
                  </label>
                  <select
                    value={addPartId || activeInventoryItems[0]?.id || ''}
                    onChange={(e) => setAddPartId(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  >
                    {activeInventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.partName} ({item.sku}) — Avail: {item.quantityOnHand} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={addPartQty}
                    onChange={(e) => setAddPartQty(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddEstPart}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Part</span>
                </button>
              </div>

              {/* Estimated Cost Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-900 text-white rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Est. Materials</span>
                  <span className="font-mono font-bold text-sm">
                    {garageConfig.currencySymbol}
                    {estimatedPartsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Est. Labour</span>
                  <input
                    type="number"
                    min="0"
                    value={estimatedLabour}
                    onChange={(e) => setEstimatedLabour(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-0.5 w-28 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-mono font-bold text-xs"
                  />
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">
                    Preliminary Total (Pre-Tax)
                  </span>
                  <span className="font-mono font-bold text-sm text-cyan-300">
                    {garageConfig.currencySymbol}
                    {(estimatedPartsTotal + estimatedLabour).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Date & Time Bay Slot */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  4. Schedule Bay Date & Time Window
                </h4>
                <p className="text-slate-500 mb-3">
                  System prevents overlapping appointments for the same vehicle
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setConflictError(null);
                    }}
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Start Slot (07:00 - 17:00)
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        setConflictError(null);
                      }}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Expected End Slot
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        setConflictError(null);
                      }}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Standard service allocation is 2.5 - 4.0 workshop bay hours.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Customer Contact & Defect Notes */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  5. Customer Contact & Driver Defect Notes
                </h4>
                <p className="text-slate-500 mb-3">
                  Customer contact info will pre-fill the final GST invoice upon job completion.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Fleet Owner / Company"
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 ..."
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="accounts@client.in"
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Driver Remarks / Unplanned Defect Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Driver reported faint squeal during regenerative braking. Please inspect brake calipers and lubricate coupling pins."
                  value={unplannedNotes}
                  onChange={(e) => setUnplannedNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Review & Submit */}
          {currentStep === 6 && currentVehicle && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">
                  6. Review & Confirm Booking Proposal
                </h4>
                <p className="text-slate-500 mb-3">
                  Creates booking in Preliminary Bookings with preliminary material estimate attached. Stock remains untouched.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {currentVehicle.registrationNumber} ({currentVehicle.model})
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Garage Facility:</span>
                  <span className="font-semibold text-slate-800">{garageConfig.garageName}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Service Type:</span>
                  <span className="font-bold text-slate-900">{selectedServiceType}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Scheduled Slot:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {date} at {startTime} - {endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Estimated Materials:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {estimatedMaterials.length} item(s) · {garageConfig.currencySymbol}
                    {estimatedPartsTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Estimated Total (Parts + Labour):</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {garageConfig.currencySymbol}
                    {(estimatedPartsTotal + estimatedLabour).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded border border-slate-300 bg-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-[#0051a8] hover:bg-[#003d80] rounded shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Service Booking</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
