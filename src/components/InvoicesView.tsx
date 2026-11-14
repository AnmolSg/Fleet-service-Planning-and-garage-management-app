import React, { useState } from 'react';
import { GarageConfig, Invoice, InvoicePaymentStatus } from '../types/fleet';
import { Search, Receipt, Eye, CheckCircle2, XCircle } from 'lucide-react';

interface InvoicesViewProps {
  invoices: Invoice[];
  garageConfig: GarageConfig;
  onInspectInvoice: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  garageConfig,
  onInspectInvoice,
}) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | InvoicePaymentStatus | 'cancelled'>('all');

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      search.trim() === '' ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.vehicleReg.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.serviceType.toLowerCase().includes(search.toLowerCase());

    const matchesPay =
      paymentFilter === 'all'
        ? true
        : paymentFilter === 'cancelled'
        ? inv.status === 'cancelled'
        : inv.status === 'active' && inv.paymentStatus === paymentFilter;

    return matchesSearch && matchesPay;
  });

  const activeTotal = invoices
    .filter((i) => i.status === 'active')
    .reduce((sum, i) => sum + i.finalPayableAmount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            BILLING & SERVICE HISTORY · {garageConfig.garageName.toUpperCase()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#0051a8]" />
            <span>Generated Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {invoices.length} invoice record{invoices.length === 1 ? '' : 's'} · Active billed revenue:{' '}
            <span className="font-mono font-bold text-slate-800">
              {garageConfig.currencySymbol}
              {activeTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice #, reg, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-xs py-2 pl-9 pr-3 rounded-md w-60 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-medium py-2 px-3 rounded-md cursor-pointer"
          >
            <option value="all">All Invoices</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="cancelled">Cancelled / Reversed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Customer</th>
              <th className="py-3 px-3">Vehicle</th>
              <th className="py-3 px-3">Service Type</th>
              <th className="py-3 px-3 text-right">Parts</th>
              <th className="py-3 px-3 text-right">Final Payable</th>
              <th className="py-3 px-3">Payment / Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  No invoices generated yet. Open any In Progress repair job and click &ldquo;Materials &amp; Invoice&rdquo; to preview and generate one.
                </td>
              </tr>
            ) : (
              filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{inv.invoiceDate}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{inv.customerName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{inv.customerPhone}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-800">{inv.vehicleReg}</div>
                    <div className="text-[10px] text-slate-500">{inv.vehicleMakeModel}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-700 font-medium">{inv.serviceType}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-600">
                    {inv.lineItems.length} item{inv.lineItems.length === 1 ? '' : 's'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                    {inv.garageSnapshot.currencySymbol}
                    {inv.finalPayableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3">
                    {inv.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>Cancelled (Stock Restored)</span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.paymentStatus === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.paymentStatus === 'Partially Paid'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{inv.paymentStatus}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onInspectInvoice(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#0051a8] hover:bg-blue-50 rounded border border-blue-200"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview / Print / PDF</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
