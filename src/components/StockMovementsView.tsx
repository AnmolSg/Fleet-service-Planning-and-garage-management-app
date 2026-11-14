import React, { useState } from 'react';
import { GarageConfig, StockMovement, StockMovementType } from '../types/fleet';
import { Search, ArrowLeftRight } from 'lucide-react';

interface StockMovementsViewProps {
  stockMovements: StockMovement[];
  garageConfig: GarageConfig;
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({
  stockMovements,
  garageConfig,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | StockMovementType>('all');

  const filtered = stockMovements.filter((m) => {
    const matchesType = typeFilter === 'all' || m.transactionType === typeFilter;
    const matchesSearch =
      search.trim() === '' ||
      m.partName.toLowerCase().includes(search.toLowerCase()) ||
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.transactionCode.toLowerCase().includes(search.toLowerCase()) ||
      (m.invoiceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.repairJobId || '').toLowerCase().includes(search.toLowerCase()) ||
      m.remarks.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const typeBadge = (t: StockMovementType) => {
    switch (t) {
      case 'stock_in':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'service_consumption':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'invoice_reversal':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'purchase_return':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'manual_adjustment':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            AUDIT TRAIL · {garageConfig.garageName.toUpperCase()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-[#0051a8]" />
            <span>Stock Movements History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable inventory transaction ledger across service invoices, purchases, manual audits, and invoice reversals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search TXN, part, SKU, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-slate-200 text-xs py-2 pl-9 pr-3 rounded-md w-60 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-white border border-slate-200 text-xs font-medium py-2 px-3 rounded-md cursor-pointer"
          >
            <option value="all">All Transaction Types</option>
            <option value="stock_in">Stock Purchase / In</option>
            <option value="service_consumption">Service Consumption (Invoice)</option>
            <option value="manual_adjustment">Manual Adjustment</option>
            <option value="purchase_return">Purchase Return</option>
            <option value="invoice_reversal">Invoice Cancellation Reversal</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-3">Item / SKU</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3 text-right">Prev Qty</th>
              <th className="py-3 px-3 text-right">Change</th>
              <th className="py-3 px-3 text-right">Updated Qty</th>
              <th className="py-3 px-3">Job / Invoice Ref</th>
              <th className="py-3 px-3">User</th>
              <th className="py-3 px-4">Date & Remarks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-slate-400">
                  No stock movements found matching your criteria.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {m.transactionCode}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{m.partName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{m.sku}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize border ${typeBadge(
                        m.transactionType
                      )}`}
                    >
                      {m.transactionType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                    {m.previousQuantity} {m.unit}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                      m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                    {m.updatedQuantity} {m.unit}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    {m.invoiceNumber && (
                      <div className="font-bold text-blue-700">{m.invoiceNumber}</div>
                    )}
                    {m.repairJobId && <div className="text-slate-500">#{m.repairJobId}</div>}
                    {!m.invoiceNumber && !m.repairJobId && (
                      <span className="text-slate-400">{m.supplierName || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-700">{m.performedBy}</td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-[10px] text-slate-400">
                      {new Date(m.timestamp).toLocaleString()}
                    </div>
                    <div className="text-slate-700 mt-0.5">{m.remarks}</div>
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
