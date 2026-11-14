import React, { useState } from 'react';
import { HydrationAlert } from '../types/hydration';
import { ChevronLeft, ChevronRight, X, RefreshCw } from 'lucide-react';

interface AlertsBannerProps {
  alerts: HydrationAlert[];
  onDismissAlert: (id: string) => void;
  onDismissAll: () => void;
  onResetAlerts: () => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  alerts,
  onDismissAlert,
  onDismissAll,
  onResetAlerts,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'dismissed'>('all');
  const [page, setPage] = useState(0);
  const itemsPerPage = 4;

  const filteredAlerts = alerts.filter((a) =>
    filterMode === 'all' ? !a.dismissed : a.dismissed
  );

  const totalPages = Math.max(1, Math.ceil(filteredAlerts.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const displayedAlerts = filteredAlerts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3.5 mb-6 shadow-sm">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 whitespace-nowrap">
            NEW UPDATES
          </span>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Interactive filter tabs matching screenshot */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setFilterMode('all');
                setPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Alerts ({alerts.filter((a) => !a.dismissed).length})
            </button>
            <button
              onClick={() => {
                setFilterMode('dismissed');
                setPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                filterMode === 'dismissed'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Dismissed ({alerts.filter((a) => a.dismissed).length})
            </button>
          </div>
        </div>

        {/* Right side: Dismiss all + Pagination */}
        <div className="flex items-center gap-3">
          {filterMode === 'all' && filteredAlerts.length > 0 && (
            <button
              onClick={onDismissAll}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:border-slate-300 transition-colors whitespace-nowrap"
            >
              Dismiss all
            </button>
          )}

          {filteredAlerts.length === 0 && filterMode === 'all' && (
            <button
              onClick={onResetAlerts}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restore alerts</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>
              {filteredAlerts.length > 0
                ? `${currentPage * itemsPerPage + 1} - ${Math.min(
                    (currentPage + 1) * itemsPerPage,
                    filteredAlerts.length
                  )} of ${filteredAlerts.length} Updates`
                : '0 Updates'}
            </span>

            <div className="flex items-center ml-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
        {displayedAlerts.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-slate-400">
            {filterMode === 'all'
              ? 'No active hydration alerts. You are completely caught up!'
              : 'No dismissed alerts in history.'}
          </div>
        ) : (
          displayedAlerts.map((alert) => {
            // Indicator color bar matching screenshot's dash stripes
            const isProposal = alert.type === 'proposal';
            const isConfirmed = alert.type === 'confirmed';
            const isPerformed = alert.type === 'performed';

            const barColor = isProposal
              ? 'bg-amber-400'
              : isConfirmed
              ? 'bg-emerald-500'
              : isPerformed
              ? 'bg-indigo-600'
              : 'bg-rose-500';

            return (
              <div
                key={alert.id}
                className="bg-white rounded-md border border-slate-200 p-3 flex flex-col justify-between hover:border-slate-300 transition-shadow hover:shadow-xs relative"
              >
                <div>
                  {/* Top bar with dash indicator and close button */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-1 rounded-xs ${barColor}`} />
                        <div className={`w-3 h-1 rounded-xs ${barColor}`} />
                        <div className={`w-3 h-1 rounded-xs ${barColor} opacity-50`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 capitalize">
                        {alert.type}
                      </span>
                    </div>

                    {!alert.dismissed && (
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100 transition-colors"
                        aria-label="Dismiss alert"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Message body */}
                  <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-3 mb-2">
                    {alert.message}
                  </p>
                </div>

                {/* Footer timestamp */}
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-50 flex items-center justify-between">
                  <span>{alert.timeAgo}</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    {alert.category}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
