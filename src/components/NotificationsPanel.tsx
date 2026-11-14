import React, { useState } from 'react';
import { FleetNotification } from '../types/fleet';
import { ChevronLeft, ChevronRight, X, RefreshCw } from 'lucide-react';

interface NotificationsPanelProps {
  notifications: FleetNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onReset: () => void;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onReset,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'dismissed'>('all');
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const filtered = notifications.filter((n) =>
    filterMode === 'all' ? !n.dismissed : n.dismissed
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(page, totalPages - 1);
  const displayed = filtered.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Helper for progress bar indicator color
  const getIndicatorColor = (type: FleetNotification['type']) => {
    switch (type) {
      case 'proposal':
        return 'bg-[#f59e0b]'; // Yellow
      case 'confirmed':
        return 'bg-[#10b981]'; // Green
      case 'performed':
        return 'bg-[#334155]'; // Dark grey
      case 'delayed':
        return 'bg-[#ef4444]'; // Red
      case 'repair':
        return 'bg-[#dc2626]'; // Dark red
      case 'low_stock':
        return 'bg-[#d97706]'; // Amber warning
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-3.5 mb-5 shadow-2xs">
      {/* Top Controls Row matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-900 whitespace-nowrap">
            NEW UPDATES
          </span>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Interactive filter tabs matching screenshot */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setFilterMode('all');
                setPage(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-[#004f9f] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Updates
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
              Dismissed
            </button>
          </div>
        </div>

        {/* Right side: Dismiss all + Pagination */}
        <div className="flex items-center gap-3">
          {filterMode === 'all' && filtered.length > 0 && (
            <button
              onClick={onDismissAll}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded border border-slate-300 hover:border-slate-400 bg-white transition-colors whitespace-nowrap shadow-2xs"
            >
              Dismiss all
            </button>
          )}

          {filtered.length === 0 && filterMode === 'all' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restore updates</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono tabular-nums">
            <span>
              {filtered.length > 0
                ? `${currentPage * itemsPerPage + 1} - ${Math.min(
                    (currentPage + 1) * itemsPerPage,
                    filtered.length
                  )} of ${filtered.length} Updates`
                : '0 Updates'}
            </span>

            <div className="flex items-center ml-1">
              <button
                disabled={currentPage === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                aria-label="Previous updates"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none rounded hover:bg-slate-100"
                aria-label="Next updates"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Row matching screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
        {displayed.length === 0 ? (
          <div className="col-span-full py-6 text-center text-xs text-slate-400">
            {filterMode === 'all'
              ? 'No active notifications to display.'
              : 'No dismissed notifications found.'}
          </div>
        ) : (
          displayed.map((item) => {
            const barColor = getIndicatorColor(item.type);

            return (
              <div
                key={item.id}
                className="bg-white rounded border border-slate-200 p-2.5 flex flex-col justify-between hover:border-slate-300 transition-all hover:shadow-2xs relative"
              >
                <div>
                  {/* Top bar with dash indicator and close button */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-1 rounded-xs ${barColor}`} />
                        <div className={`w-3 h-1 rounded-xs ${barColor}`} />
                        <div className={`w-3 h-1 rounded-xs ${barColor} opacity-40`} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800 capitalize">
                        {item.title}
                      </span>
                    </div>

                    {!item.dismissed && (
                      <button
                        onClick={() => onDismiss(item.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Message body matching screenshot prose */}
                  <p className="text-[11px] text-slate-600 leading-snug font-sans line-clamp-3 mb-2">
                    {item.message}
                  </p>
                </div>

                {/* Footer time ago */}
                <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                  <span>{item.timeAgo}</span>
                  {item.bookingRef && (
                    <span className="font-mono text-slate-400 font-semibold">
                      #{item.bookingRef}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
