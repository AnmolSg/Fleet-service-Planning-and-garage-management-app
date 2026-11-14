import React, { useState, useEffect } from 'react';
import {
  GarageConfig,
  InventoryItem,
  ServiceBooking,
  Vehicle,
} from '../types/fleet';
import {
  X,
  Wrench,
  Package,
  Plus,
  Trash2,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface RepairJobConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ServiceBooking | null;
  vehicle: Vehicle | null;
  inventory: InventoryItem[];
  garageConfig: GarageConfig;
  onUpdateActualQty: (bookingId: string, actualLineId: string, qty: number) => void;
  onAddAdditionalMaterial: (
    bookingId: string,
    payload: { inventoryItemId: string; quantity: number; unitPrice?: number; reason: string }
  ) => { success: boolean; error?: string };
  onUpdateAdditionalMaterial: (
    bookingId: string,
    lineId: string,
    updates: { quantity?: number; unitPrice?: number; reason?: string }
  ) => void;
  onRemoveAdditionalMaterial: (bookingId: string, lineId: string) => void;
  onUpdateChargesAndNotes: (
    bookingId: string,
    updates: {
      labourCharges?: number;
      additionalServiceCharges?: number;
      discountAmount?: number;
      workPerformedDescription?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
    }
  ) => void;
  onOpenInvoicePreview: (bookingId: string) => void;
}

export const RepairJobConsumptionModal: React.FC<RepairJobConsumptionModalProps> = ({
  isOpen,
  onClose,
  booking,
  vehicle,
  inventory,
  garageConfig,
  onUpdateActualQty,
  onAddAdditionalMaterial,
  onUpdateAdditionalMaterial,
  onRemoveAdditionalMaterial,
  onUpdateChargesAndNotes,
  onOpenInvoicePreview,
}) => {
  const [searchPart, setSearchPart] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [addQty, setAddQty] = useState('1');
  const [addPrice, setAddPrice] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const activeInventory = inventory.filter((i) => i.isActive);
  const filteredParts = activeInventory.filter(
    (i) =>
      searchPart.trim() === '' ||
      i.partName.toLowerCase().includes(searchPart.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchPart.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && activeInventory.length > 0 && !selectedPartId) {
      setSelectedPartId(activeInventory[0].id);
      setAddPrice(String(activeInventory[0].sellingPrice));
    }
  }, [isOpen, activeInventory.length]);

  if (!isOpen || !booking) return null;

  const isLocked = booking.invoiceStatus === 'generated';

  const handleSelectPartChange = (id: string) => {
    setSelectedPartId(id);
    const item = inventory.find((i) => i.id === id);
    if (item) {
      setAddPrice(String(item.sellingPrice));
    }
  };

  const handleAddAdditional = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const targetId = selectedPartId || filteredParts[0]?.id;
    if (!targetId) {
      setAddError('Select a spare part first.');
      return;
    }
    const res = onAddAdditionalMaterial(booking.id, {
      inventoryItemId: targetId,
      quantity: parseFloat(addQty) || 0,
      unitPrice: addPrice !== '' ? parseFloat(addPrice) : undefined,
      reason: addReason.trim() || 'Additional replacement found during workshop inspection',
    });

    if (!res.success) {
      setAddError(res.error || 'Could not add material.');
      return;
    }
    setAddQty('1');
    setAddReason('');
  };

  // Totals preview
  const estActualSubtotal = (booking.actualMaterials || []).reduce(
    (sum, a) => sum + a.actualQuantity * a.unitPrice,
    0
  );
  const additionalSubtotal = (booking.additionalMaterials || []).reduce(
    (sum, a) => sum + a.quantity * a.unitPrice,
    0
  );
  const materialsSubtotal = estActualSubtotal + additionalSubtotal;
  const preTax = Math.max(
    0,
    materialsSubtotal +
      (booking.labourCharges || 0) +
      (booking.additionalServiceCharges || 0) -
      (booking.discountAmount || 0)
  );
  const taxAmt = garageConfig.taxEnabled ? (preTax * garageConfig.taxRatePercent) / 100 : 0;
  const grandTotal = preTax + taxAmt;

  // Check if any combined qty exceeds current available stock
  const stockShortages: string[] = [];
  const qtyByItem = new Map<string, number>();
  for (const a of booking.actualMaterials || []) {
    if (a.actualQuantity > 0) {
      qtyByItem.set(a.inventoryItemId, (qtyByItem.get(a.inventoryItemId) || 0) + a.actualQuantity);
    }
  }
  for (const ad of booking.additionalMaterials || []) {
    if (ad.quantity > 0) {
      qtyByItem.set(ad.inventoryItemId, (qtyByItem.get(ad.inventoryItemId) || 0) + ad.quantity);
    }
  }
  for (const [id, req] of qtyByItem.entries()) {
    const inv = inventory.find((i) => i.id === id);
    if (inv && inv.quantityOnHand < req) {
      stockShortages.push(
        `${inv.partName} (Need ${req} ${inv.unit}, Available ${inv.quantityOnHand} ${inv.unit})`
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#071322] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#0051a8] flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">
                Service Material Consumption · #{booking.bookingRef}
              </h3>
              <p className="text-[11px] text-slate-300 font-mono">
                {booking.vehicleReg} ({booking.vehicleModel}) · {booking.serviceType || 'General Service'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Inventory Rule Notice */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
              isLocked
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLocked ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
              )}
              <span className="font-semibold">
                {isLocked
                  ? `Invoice ${booking.invoiceNumber} has been generated and stock has been deducted. Material records are locked.`
                  : 'Mechanic Consumption Log: Inventory is NOT deducted while adding or editing materials here. Stock deducts only upon Final Invoice confirmation.'}
              </span>
            </div>
          </div>

          {!isLocked && stockShortages.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Stock Shortage Detected for Current Quantities:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                  {stockShortages.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* SECTION A & B: Estimated Materials vs Actual Materials Used */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  A. Estimated Materials & B. Actual Materials Used
                </h4>
                <p className="text-[11px] text-slate-500">
                  Compare service estimate against actual quantities consumed by the mechanic
                </p>
              </div>
              <span className="font-mono font-bold text-slate-800">
                Subtotal: {garageConfig.currencySymbol}
                {estActualSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-2 px-4">Part / SKU</th>
                  <th className="py-2 px-3 text-right">A. Estimated Qty</th>
                  <th className="py-2 px-3 text-right">B. Actual Used Qty</th>
                  <th className="py-2 px-3 text-right">In Stock</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(booking.actualMaterials || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-5 text-center text-slate-400">
                      No preliminary estimated materials attached to this job. Use Additional Materials below.
                    </td>
                  </tr>
                ) : (
                  booking.actualMaterials.map((act) => {
                    const inv = inventory.find((i) => i.id === act.inventoryItemId);
                    const avail = inv?.quantityOnHand ?? 0;
                    const overStock = !isLocked && act.actualQuantity > avail;

                    return (
                      <tr key={act.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">{act.partName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{act.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {act.estimatedQuantity} {act.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              disabled={isLocked}
                              value={act.actualQuantity}
                              onChange={(e) =>
                                onUpdateActualQty(
                                  booking.id,
                                  act.id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-16 text-right font-mono font-bold p-1 border rounded ${
                                overStock
                                  ? 'border-rose-400 bg-rose-50 text-rose-800'
                                  : 'border-slate-300 bg-white'
                              }`}
                            />
                            <span className="text-[11px] text-slate-500 w-12 text-left">
                              {act.unit}
                            </span>
                          </div>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-semibold ${
                            overStock ? 'text-rose-600' : 'text-slate-600'
                          }`}
                        >
                          {avail} {act.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {garageConfig.currencySymbol}
                          {act.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {garageConfig.currencySymbol}
                          {(act.actualQuantity * act.unitPrice).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION C: Additional Materials */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  C. Additional Materials Used (Unplanned / Extra)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Extra spare parts added by the mechanic during repair — editable until invoice confirmation
                </p>
              </div>
              <span className="font-mono font-bold text-slate-800">
                Subtotal: {garageConfig.currencySymbol}
                {additionalSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {booking.additionalMaterials.length > 0 && (
              <table className="w-full text-left text-xs border-b border-slate-200">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="py-2 px-4">Part / SKU</th>
                    <th className="py-2 px-3">Reason / Description</th>
                    <th className="py-2 px-3 text-right">Qty Used</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Total</th>
                    <th className="py-2 px-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {booking.additionalMaterials.map((add) => (
                    <tr key={add.id}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{add.partName}</div>
                        <div className="text-[10px] font-mono text-slate-400">{add.sku}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          disabled={isLocked}
                          value={add.reason}
                          onChange={(e) =>
                            onUpdateAdditionalMaterial(booking.id, add.id, {
                              reason: e.target.value,
                            })
                          }
                          className="w-full p-1 border border-slate-200 rounded bg-white text-slate-700"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          disabled={isLocked}
                          value={add.quantity}
                          onChange={(e) =>
                            onUpdateAdditionalMaterial(booking.id, add.id, {
                              quantity: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 text-right font-mono font-bold p-1 border border-slate-300 rounded"
                        />{' '}
                        <span className="text-[11px] text-slate-500">{add.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <input
                          type="number"
                          min="0"
                          disabled={isLocked}
                          value={add.unitPrice}
                          onChange={(e) =>
                            onUpdateAdditionalMaterial(booking.id, add.id, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 text-right font-mono p-1 border border-slate-300 rounded"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {garageConfig.currencySymbol}
                        {(add.quantity * add.unitPrice).toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => onRemoveAdditionalMaterial(booking.id, add.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove additional part"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Add Additional Part Form */}
            {!isLocked && (
              <form onSubmit={handleAddAdditional} className="p-4 bg-slate-50/70 space-y-3">
                {addError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 font-semibold">
                    {addError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Search & Select Inventory Item
                    </label>
                    <input
                      type="text"
                      placeholder="Filter parts..."
                      value={searchPart}
                      onChange={(e) => setSearchPart(e.target.value)}
                      className="w-full p-1.5 mb-1 border border-slate-200 rounded bg-white text-[11px]"
                    />
                    <select
                      value={selectedPartId}
                      onChange={(e) => handleSelectPartChange(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white"
                    >
                      {filteredParts.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.partName} ({item.sku}) · Stock: {item.quantityOnHand} {item.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Qty Used
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.5"
                      required
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Unit Price ({garageConfig.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={addPrice}
                      onChange={(e) => setAddPrice(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Reason / Repair Note
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Worn fuel filter discovered"
                        value={addReason}
                        onChange={(e) => setAddReason(e.target.value)}
                        className="flex-1 p-2 border border-slate-300 rounded bg-white"
                      />
                      <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-2 bg-[#0051a8] hover:bg-[#003d80] text-white font-bold rounded shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Labour, Additional Charges, Discount & Work Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Customer & Work Performed
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={booking.customerName || vehicle?.customerName || ''}
                    onChange={(e) =>
                      onUpdateChargesAndNotes(booking.id, { customerName: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    disabled={isLocked}
                    value={booking.customerPhone || vehicle?.customerPhone || ''}
                    onChange={(e) =>
                      onUpdateChargesAndNotes(booking.id, { customerPhone: e.target.value })
                    }
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Description of Work Performed
                </label>
                <textarea
                  rows={3}
                  disabled={isLocked}
                  value={booking.workPerformedDescription ?? booking.serviceActivities}
                  onChange={(e) =>
                    onUpdateChargesAndNotes(booking.id, {
                      workPerformedDescription: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Labour & Billing Summary
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Labour ({garageConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isLocked}
                    value={booking.labourCharges}
                    onChange={(e) =>
                      onUpdateChargesAndNotes(booking.id, {
                        labourCharges: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Extra Service ({garageConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isLocked}
                    value={booking.additionalServiceCharges}
                    onChange={(e) =>
                      onUpdateChargesAndNotes(booking.id, {
                        additionalServiceCharges: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Discount ({garageConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isLocked}
                    value={booking.discountAmount}
                    onChange={(e) =>
                      onUpdateChargesAndNotes(booking.id, {
                        discountAmount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Spare Parts & Consumables:</span>
                  <span>
                    {garageConfig.currencySymbol}
                    {materialsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    GST / Tax ({garageConfig.taxEnabled ? `${garageConfig.taxRatePercent}%` : 'Off'}):
                  </span>
                  <span>
                    {garageConfig.currencySymbol}
                    {taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                  <span>Estimated Final Payable:</span>
                  <span>
                    {garageConfig.currencySymbol}
                    {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded bg-white hover:bg-slate-100"
          >
            Save & Close
          </button>

          <button
            type="button"
            onClick={() => onOpenInvoicePreview(booking.id)}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded shadow-xs"
          >
            <Receipt className="w-4 h-4" />
            <span>{isLocked ? `View Invoice ${booking.invoiceNumber}` : 'Preview & Generate Invoice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
