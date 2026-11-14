import React, { useState, useEffect } from 'react';
import {
  GarageConfig,
  Invoice,
  InvoiceLineItem,
  InvoicePaymentMethod,
  InvoicePaymentStatus,
  ServiceBooking,
  Vehicle,
} from '../types/fleet';
import { jsPDF } from 'jspdf';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  Warehouse,
} from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Either viewing an existing invoice OR previewing/generating from a booking
  existingInvoice: Invoice | null;
  booking: ServiceBooking | null;
  vehicle: Vehicle | null;
  garageConfig: GarageConfig;
  onConfirmGenerateInvoice: (params: {
    bookingId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    odometerReading: number;
    workPerformed: string;
    labourCharges: number;
    additionalServiceCharges: number;
    discountAmount: number;
    paymentStatus: InvoicePaymentStatus;
    amountPaid: number;
    paymentMethod: InvoicePaymentMethod;
  }) => { success: boolean; error?: string; invoice?: Invoice };
  onUpdatePayment: (
    invoiceId: string,
    updates: {
      paymentStatus: InvoicePaymentStatus;
      amountPaid: number;
      paymentMethod: InvoicePaymentMethod;
    }
  ) => void;
  onCancelInvoice: (invoiceId: string, reason: string) => { success: boolean; error?: string };
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  existingInvoice,
  booking,
  vehicle,
  garageConfig,
  onConfirmGenerateInvoice,
  onUpdatePayment,
  onCancelInvoice,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [odometerReading, setOdometerReading] = useState('0');
  const [workPerformed, setWorkPerformed] = useState('');
  const [labourCharges, setLabourCharges] = useState('0');
  const [additionalServiceCharges, setAdditionalServiceCharges] = useState('0');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [paymentStatus, setPaymentStatus] = useState<InvoicePaymentStatus>('Paid');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<InvoicePaymentMethod>('UPI / Bank Transfer');

  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(existingInvoice);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('Billing correction / customer request');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowCancelConfirm(false);

    if (existingInvoice) {
      setGeneratedInvoice(existingInvoice);
      setPaymentStatus(existingInvoice.paymentStatus);
      setAmountPaid(String(existingInvoice.amountPaid));
      setPaymentMethod(existingInvoice.paymentMethod);
    } else if (booking) {
      setGeneratedInvoice(null);
      setCustomerName(booking.customerName || vehicle?.customerName || 'Fleet Customer');
      setCustomerPhone(booking.customerPhone || vehicle?.customerPhone || '-');
      setCustomerEmail(booking.customerEmail || vehicle?.customerEmail || '');
      setOdometerReading(String(vehicle?.odometer || 0));
      setWorkPerformed(booking.workPerformedDescription || booking.serviceActivities);
      setLabourCharges(String(booking.labourCharges || 0));
      setAdditionalServiceCharges(String(booking.additionalServiceCharges || 0));
      setDiscountAmount(String(booking.discountAmount || 0));
      setPaymentStatus('Paid');
      setPaymentMethod('UPI / Bank Transfer');
    }
  }, [isOpen, existingInvoice, booking]);

  if (!isOpen) return null;

  const activeInv = existingInvoice || generatedInvoice;
  const g = activeInv ? activeInv.garageSnapshot : garageConfig;

  // Build line items either from persisted invoice OR preview from booking
  const previewLineItems: InvoiceLineItem[] = activeInv
    ? activeInv.lineItems
    : [
        ...(booking?.actualMaterials || [])
          .filter((a) => a.actualQuantity > 0)
          .map((a) => ({
            id: a.id,
            inventoryItemId: a.inventoryItemId,
            partName: a.partName,
            sku: a.sku,
            unit: a.unit,
            materialSource: 'estimated_actual' as const,
            estimatedQuantity: a.estimatedQuantity,
            quantity: a.actualQuantity,
            unitPrice: a.unitPrice,
            lineTotal: Math.round(a.actualQuantity * a.unitPrice * 100) / 100,
          })),
        ...(booking?.additionalMaterials || [])
          .filter((a) => a.quantity > 0)
          .map((a) => ({
            id: a.id,
            inventoryItemId: a.inventoryItemId,
            partName: a.partName,
            sku: a.sku,
            unit: a.unit,
            materialSource: 'additional' as const,
            quantity: a.quantity,
            unitPrice: a.unitPrice,
            lineTotal: Math.round(a.quantity * a.unitPrice * 100) / 100,
            reason: a.reason,
          })),
      ];

  const materialsSubtotal = activeInv
    ? activeInv.materialsSubtotal
    : previewLineItems.reduce((sum, li) => sum + li.lineTotal, 0);
  const labourNum = activeInv ? activeInv.labourCharges : parseFloat(labourCharges) || 0;
  const addSvcNum = activeInv
    ? activeInv.additionalServiceCharges
    : parseFloat(additionalServiceCharges) || 0;
  const discountNum = activeInv ? activeInv.discountAmount : parseFloat(discountAmount) || 0;
  const preTax = Math.max(0, materialsSubtotal + labourNum + addSvcNum - discountNum);
  const taxAmt = activeInv
    ? activeInv.taxAmount
    : g.taxEnabled
    ? Math.round(((preTax * g.taxRatePercent) / 100) * 100) / 100
    : 0;
  const finalPayable = activeInv
    ? activeInv.finalPayableAmount
    : Math.round((preTax + taxAmt) * 100) / 100;

  const displayInvNum =
    activeInv?.invoiceNumber || `${g.invoicePrefix}-${g.nextInvoiceSequence} (DRAFT)`;
  const displayDate = activeInv?.invoiceDate || new Date().toISOString().slice(0, 10);
  const displayCustomerName = activeInv?.customerName || customerName;
  const displayCustomerPhone = activeInv?.customerPhone || customerPhone;
  const displayVehicleReg = activeInv?.vehicleReg || booking?.vehicleReg || '-';
  const displayVehicleModel = activeInv?.vehicleMakeModel || booking?.vehicleModel || '-';
  const displayOdometer = activeInv?.odometerReading ?? (parseInt(odometerReading, 10) || 0);
  const displayServiceType = activeInv?.serviceType || booking?.serviceType || 'General Service';
  const displayWork = activeInv?.workPerformed || workPerformed;

  const handleConfirmGenerate = () => {
    if (!booking) return;
    setErrorMsg(null);
    const res = onConfirmGenerateInvoice({
      bookingId: booking.id,
      customerName,
      customerPhone,
      customerEmail,
      odometerReading: parseInt(odometerReading, 10) || 0,
      workPerformed,
      labourCharges: parseFloat(labourCharges) || 0,
      additionalServiceCharges: parseFloat(additionalServiceCharges) || 0,
      discountAmount: parseFloat(discountAmount) || 0,
      paymentStatus,
      amountPaid: parseFloat(amountPaid) || 0,
      paymentMethod,
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to generate invoice.');
      return;
    }

    if (res.invoice) {
      setGeneratedInvoice(res.invoice);
      setSuccessMsg(
        `Invoice ${res.invoice.invoiceNumber} confirmed! Consumed spare parts deducted from inventory.`
      );
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const curr = g.currencySymbol === '₹' ? 'Rs. ' : `${g.currencySymbol} `;
    let y = 48;

    // Header banner
    doc.setFillColor(7, 19, 34);
    doc.rect(36, 30, 523, 66, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(g.garageName, 50, 54);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${g.address}`, 50, 70);
    doc.text(`Tel: ${g.phone} | Email: ${g.email} | GSTIN: ${g.gstNumber}`, 50, 84);

    doc.setTextColor(15, 23, 42);
    y = 120;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TAX INVOICE: ${displayInvNum}`, 36, y);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${displayDate}`, 440, y);

    y += 22;
    doc.setDrawColor(203, 213, 225);
    doc.line(36, y, 559, y);
    y += 18;

    // Customer & Vehicle
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 36, y);
    doc.text('VEHICLE DETAILS:', 300, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.text(`${displayCustomerName}`, 36, y);
    doc.text(`Reg No: ${displayVehicleReg} (${displayVehicleModel})`, 300, y);
    y += 13;
    doc.text(`Phone: ${displayCustomerPhone}`, 36, y);
    doc.text(`Odometer: ${displayOdometer.toLocaleString()} km`, 300, y);
    y += 13;
    doc.text(`Service Type: ${displayServiceType}`, 300, y);

    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Work Performed:', 36, y);
    y += 13;
    doc.setFont('helvetica', 'normal');
    const splitWork = doc.splitTextToSize(displayWork || '-', 520);
    doc.text(splitWork, 36, y);
    y += splitWork.length * 12 + 12;

    // Items Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(36, y, 523, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('PART / DESCRIPTION', 42, y + 13);
    doc.text('TYPE', 250, y + 13);
    doc.text('QTY', 345, y + 13);
    doc.text('RATE', 420, y + 13);
    doc.text('AMOUNT', 500, y + 13);
    y += 26;

    doc.setFont('helvetica', 'normal');
    for (const li of previewLineItems) {
      if (y > 730) {
        doc.addPage();
        y = 50;
      }
      doc.text(`${li.partName} (${li.sku})`, 42, y);
      doc.text(li.materialSource === 'additional' ? 'Additional' : 'Scheduled', 250, y);
      doc.text(`${li.quantity} ${li.unit}`, 345, y);
      doc.text(`${curr}${li.unitPrice.toFixed(2)}`, 420, y);
      doc.text(`${curr}${li.lineTotal.toFixed(2)}`, 500, y);
      y += 16;
    }

    y += 8;
    doc.line(36, y, 559, y);
    y += 18;

    const addSummaryRow = (label: string, val: string, bold = false) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 11 : 9.5);
      doc.text(label, 350, y);
      doc.text(val, 500, y);
      y += 16;
    };

    addSummaryRow('Spare Parts Subtotal:', `${curr}${materialsSubtotal.toFixed(2)}`);
    addSummaryRow('Labour Charges:', `${curr}${labourNum.toFixed(2)}`);
    if (addSvcNum > 0) addSummaryRow('Additional Service Charges:', `${curr}${addSvcNum.toFixed(2)}`);
    if (discountNum > 0) addSummaryRow('Discount:', `-${curr}${discountNum.toFixed(2)}`);
    if (g.taxEnabled) {
      addSummaryRow(`GST / Tax (${g.taxRatePercent}%):`, `${curr}${taxAmt.toFixed(2)}`);
    }
    addSummaryRow('FINAL PAYABLE AMOUNT:', `${curr}${finalPayable.toFixed(2)}`, true);

    y += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Status: ${activeInv?.paymentStatus || paymentStatus} | Method: ${activeInv?.paymentMethod || paymentMethod}`, 36, y);

    doc.save(`${displayInvNum.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Chrome Header (hidden during print) */}
        <div className="no-print bg-[#071322] text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase">
              {activeInv ? `Invoice ${activeInv.invoiceNumber}` : 'Invoice Preview & Final Confirmation'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {errorMsg && (
            <div className="no-print p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 flex items-start gap-2 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="no-print p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeInv?.status === 'cancelled' && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 text-xs font-bold">
              CANCELLED INVOICE — Reversed on {activeInv.cancelledAt ? new Date(activeInv.cancelledAt).toLocaleString() : ''} · Reason: {activeInv.cancelReason} (All deducted inventory quantities were restored).
            </div>
          )}

          {/* Printable Garage Invoice Document */}
          <div
            id="invoice-printable-area"
            className="bg-white border border-slate-300 rounded-lg p-6 space-y-5 text-xs text-slate-800 shadow-2xs"
          >
            {/* Garage Branding Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-2 border-slate-900">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#071322] text-white flex items-center justify-center">
                    <Warehouse className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      {g.garageName}
                    </h2>
                    <p className="text-[11px] text-slate-500">{g.tagline}</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-2">{g.address}</p>
                <p className="text-[11px] text-slate-600 font-mono">
                  Tel: {g.phone} · Email: {g.email} · GSTIN: {g.gstNumber}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                  GARAGE TAX INVOICE
                </span>
                <p className="text-lg font-black font-mono text-slate-900 mt-0.5">
                  {displayInvNum}
                </p>
                <p className="text-[11px] font-mono text-slate-600 mt-1">
                  Date: <span className="font-bold text-slate-900">{displayDate}</span>
                </p>
                <p className="text-[11px] font-mono text-slate-600">
                  Job Ref: #{activeInv?.bookingRef || booking?.bookingRef}
                </p>
              </div>
            </div>

            {/* Customer & Vehicle Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Customer / Fleet Billing Details
                </span>
                {activeInv ? (
                  <>
                    <p className="font-bold text-slate-900 text-sm">{displayCustomerName}</p>
                    <p className="font-mono text-slate-700">{displayCustomerPhone}</p>
                    {activeInv.customerEmail && (
                      <p className="text-slate-600">{activeInv.customerEmail}</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                      className="w-full p-1.5 border border-slate-300 rounded bg-white font-semibold"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone"
                        className="w-full p-1.5 border border-slate-300 rounded bg-white font-mono"
                      />
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full p-1.5 border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Vehicle & Service Info
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Reg:</span>
                  <span className="font-mono font-bold text-slate-900">{displayVehicleReg}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Make & Model:</span>
                  <span className="font-semibold text-slate-800">{displayVehicleModel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Odometer Reading:</span>
                  {activeInv ? (
                    <span className="font-mono font-bold text-slate-800">
                      {displayOdometer.toLocaleString()} km
                    </span>
                  ) : (
                    <input
                      type="number"
                      value={odometerReading}
                      onChange={(e) => setOdometerReading(e.target.value)}
                      className="w-28 text-right font-mono font-bold p-1 border border-slate-300 rounded bg-white"
                    />
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Service Type:</span>
                  <span className="font-bold text-blue-800">{displayServiceType}</span>
                </div>
              </div>
            </div>

            {/* Description of Work Performed */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Description of Work Performed
              </span>
              {activeInv ? (
                <p className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-800">
                  {displayWork}
                </p>
              ) : (
                <textarea
                  rows={2}
                  value={workPerformed}
                  onChange={(e) => setWorkPerformed(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded bg-white"
                />
              )}
            </div>

            {/* Spare Parts & Materials Utilized Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Spare Part / Material</th>
                    <th className="py-2.5 px-3">Category Source</th>
                    <th className="py-2.5 px-3 text-right">Qty Utilized</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewLineItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No spare parts billed (Labour / Service charge only).
                      </td>
                    </tr>
                  ) : (
                    previewLineItems.map((li) => (
                      <tr key={li.id}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{li.partName}</div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {li.sku}
                            {li.reason ? ` · ${li.reason}` : ''}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {li.materialSource === 'additional' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              Additional Material
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Estimated (Actual)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums">
                          {li.quantity} {li.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {g.currencySymbol}
                          {li.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          {g.currencySymbol}
                          {li.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals & Payment Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Left: Payment Status & Method */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Payment Details
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={paymentStatus}
                      disabled={activeInv?.status === 'cancelled'}
                      onChange={(e) => {
                        const next = e.target.value as InvoicePaymentStatus;
                        setPaymentStatus(next);
                        if (activeInv) {
                          onUpdatePayment(activeInv.id, {
                            paymentStatus: next,
                            amountPaid:
                              next === 'Paid'
                                ? activeInv.finalPayableAmount
                                : next === 'Unpaid'
                                ? 0
                                : parseFloat(amountPaid) || 0,
                            paymentMethod,
                          });
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                      <option value="Partially Paid">Partially Paid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      disabled={activeInv?.status === 'cancelled'}
                      onChange={(e) => {
                        const next = e.target.value as InvoicePaymentMethod;
                        setPaymentMethod(next);
                        if (activeInv) {
                          onUpdatePayment(activeInv.id, {
                            paymentStatus,
                            amountPaid: parseFloat(amountPaid) || 0,
                            paymentMethod: next,
                          });
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="UPI / Bank Transfer">UPI / Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Corporate Credit">Corporate Credit</option>
                    </select>
                  </div>
                </div>

                {paymentStatus === 'Partially Paid' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Amount Paid ({g.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={finalPayable}
                      value={amountPaid}
                      onChange={(e) => {
                        setAmountPaid(e.target.value);
                        if (activeInv) {
                          onUpdatePayment(activeInv.id, {
                            paymentStatus,
                            amountPaid: parseFloat(e.target.value) || 0,
                            paymentMethod,
                          });
                        }
                      }}
                      className="w-full p-2 border border-slate-300 rounded bg-white font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              {/* Right: Financial Breakdown */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Spare Parts Subtotal:</span>
                  <span>
                    {g.currencySymbol}
                    {materialsSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Labour Charges:</span>
                  {activeInv ? (
                    <span>
                      {g.currencySymbol}
                      {labourNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(e.target.value)}
                      className="w-28 text-right p-1 border border-slate-300 rounded bg-white font-bold"
                    />
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Additional Service Charges:</span>
                  {activeInv ? (
                    <span>
                      {g.currencySymbol}
                      {addSvcNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={additionalServiceCharges}
                      onChange={(e) => setAdditionalServiceCharges(e.target.value)}
                      className="w-28 text-right p-1 border border-slate-300 rounded bg-white font-bold"
                    />
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>Discount:</span>
                  {activeInv ? (
                    <span>
                      -{g.currencySymbol}
                      {discountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-28 text-right p-1 border border-slate-300 rounded bg-white font-bold"
                    />
                  )}
                </div>

                {g.taxEnabled && (
                  <div className="flex justify-between text-slate-600">
                    <span>GST / Tax ({g.taxRatePercent}%):</span>
                    <span>
                      {g.currencySymbol}
                      {taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Final Payable Amount:</span>
                  <span>
                    {g.currencySymbol}
                    {finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cancel / Reversal Box */}
          {activeInv && activeInv.status === 'active' && showCancelConfirm && (
            <div className="no-print p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-2 text-xs">
              <p className="font-bold text-rose-900">
                Confirm Invoice Cancellation & Inventory Restoration
              </p>
              <p className="text-rose-800">
                Cancelling {activeInv.invoiceNumber} will restore all deducted quantities back to inventory and log immutable invoice_reversal stock movements.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason..."
                  className="flex-1 p-2 border border-rose-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const res = onCancelInvoice(activeInv.id, cancelReason);
                    if (!res.success) {
                      setErrorMsg(res.error || 'Failed to cancel invoice.');
                    } else {
                      setShowCancelConfirm(false);
                      setSuccessMsg(
                        `Invoice ${activeInv.invoiceNumber} cancelled. Exact stock quantities restored to inventory.`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded"
                >
                  Confirm Cancellation & Restore Stock
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (hidden during print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Invoice</span>
            </button>
            {activeInv && activeInv.status === 'active' && !showCancelConfirm && (
              <button
                type="button"
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel & Restore Stock</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded bg-white hover:bg-slate-100"
            >
              Close
            </button>
            {!activeInv && booking && (
              <button
                type="button"
                onClick={handleConfirmGenerate}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Generate Invoice & Deduct Stock</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
