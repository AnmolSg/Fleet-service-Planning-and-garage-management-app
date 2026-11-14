import React, { useState } from 'react';
import { CalendarStatus, ServiceBooking, Vehicle } from '../types/fleet';
import { VEHICLE_CATEGORY_META } from '../data/initialFleetData';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
  Info,
  Clock,
  Calendar as CalendarIcon,
  X,
  Check,
  AlertTriangle,
  Play,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface ServicePlanningCalendarProps {
  bookings: ServiceBooking[];
  vehicles: Vehicle[];
  calendarViewMode: 'week' | 'month';
  onSetCalendarViewMode: (mode: 'week' | 'month') => void;
  calendarDate: Date;
  onSetCalendarDate: (d: Date) => void;
  statusFilters: Record<CalendarStatus, boolean>;
  onToggleStatusFilter: (status: CalendarStatus) => void;
  equipmentGroup: string;
  onSetEquipmentGroup: (group: string) => void;
  onSelectVehicle: (vehicleId: string) => void;
  onUpdateBooking: (booking: ServiceBooking) => { success: boolean; error?: string };
  onCancelBooking: (bookingId: string) => void;
  onOpenBookingWizard: (preselectedVehicleId?: string, prefillDate?: string, prefillStartTime?: string) => void;
  onOpenJobMaterials?: (bookingId: string) => void;
}

export const ServicePlanningCalendar: React.FC<ServicePlanningCalendarProps> = ({
  bookings,
  vehicles,
  calendarViewMode,
  onSetCalendarViewMode,
  calendarDate,
  onSetCalendarDate,
  statusFilters,
  onToggleStatusFilter,
  equipmentGroup,
  onSetEquipmentGroup,
  onSelectVehicle,
  onUpdateBooking,
  onCancelBooking,
  onOpenBookingWizard,
  onOpenJobMaterials,
}) => {
  const [calendarSearch, setCalendarSearch] = useState('');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<ServiceBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('');
  const [rescheduleConflictError, setRescheduleConflictError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Time grid hours matching screenshot (07:00 to 17:00)
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

  // Week days for Week 39 (September 24 to 30, 2023)
  const weekDays = [
    { name: 'Sunday', dateStr: '2023-09-24', dayNum: 24 },
    { name: 'Monday', dateStr: '2023-09-25', dayNum: 25 },
    { name: 'Tuesday', dateStr: '2023-09-26', dayNum: 26 },
    { name: 'Wednesday', dateStr: '2023-09-27', dayNum: 27 },
    { name: 'Thursday', dateStr: '2023-09-28', dayNum: 28 },
    { name: 'Friday', dateStr: '2023-09-29', dayNum: 29 },
    { name: 'Saturday', dateStr: '2023-09-30', dayNum: 30 },
  ];

  // Month days generator for Month View
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth(); // 8 = September
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  // Colors matching screenshot blocks
  const statusStyles: Record<
    CalendarStatus,
    { bg: string; text: string; border: string; pillBg: string; pillText: string }
  > = {
    delayed: {
      bg: 'bg-[#fee2e2]',
      text: 'text-[#991b1b]',
      border: 'border-[#fca5a5]',
      pillBg: 'bg-[#fee2e2]',
      pillText: 'text-[#b91c1c]',
    },
    due: {
      bg: 'bg-[#dbeafe]',
      text: 'text-[#1e40af]',
      border: 'border-[#93c5fd]',
      pillBg: 'bg-[#dbeafe]',
      pillText: 'text-[#1d4ed8]',
    },
    preliminary: {
      bg: 'bg-[#fef3c7]',
      text: 'text-[#92400e]',
      border: 'border-[#fde68a]',
      pillBg: 'bg-[#fef3c7]',
      pillText: 'text-[#b45309]',
    },
    performed: {
      bg: 'bg-[#e2e8f0]',
      text: 'text-[#334155]',
      border: 'border-[#cbd5e1]',
      pillBg: 'bg-[#334155]',
      pillText: 'text-white',
    },
    confirmed: {
      bg: 'bg-[#dcfce7]',
      text: 'text-[#166534]',
      border: 'border-[#86efac]',
      pillBg: 'bg-[#dcfce7]',
      pillText: 'text-[#15803d]',
    },
    planned: {
      bg: 'bg-[#f1f5f9]',
      text: 'text-[#475569]',
      border: 'border-[#cbd5e1]',
      pillBg: 'bg-[#f1f5f9]',
      pillText: 'text-[#475569]',
    },
  };

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Convert time "08:30" to minutes from 07:00
  const timeToMinutesFromStart = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return (h - 7) * 60 + (m || 0);
  };

  const calculateTopOffset = (startTime: string): number => {
    const mins = Math.max(0, timeToMinutesFromStart(startTime));
    return (mins / 60) * 56;
  };

  const calculateBlockHeight = (startTime: string, endTime: string): number => {
    const startMins = timeToMinutesFromStart(startTime);
    const endMins = timeToMinutesFromStart(endTime);
    const diff = Math.max(45, endMins - startMins);
    return (diff / 60) * 56;
  };

  // Filter bookings for calendar
  const calendarBookings = bookings.filter((b) => {
    const matchesStatus = statusFilters[b.calendarStatus] !== false;
    const matchesGroup = equipmentGroup === 'All equipment groups' || b.equipmentGroup === equipmentGroup;
    const matchesSearch =
      calendarSearch.trim() === '' ||
      b.vehicleReg.toLowerCase().includes(calendarSearch.toLowerCase()) ||
      b.serviceActivities.toLowerCase().includes(calendarSearch.toLowerCase());

    return matchesStatus && matchesGroup && matchesSearch;
  });

  // Open Inspector
  const handleOpenEventModal = (b: ServiceBooking) => {
    setSelectedBookingForModal(b);
    setRescheduleDate(b.date);
    setRescheduleStartTime(b.startTime);
    setRescheduleEndTime(b.endTime);
    setRescheduleConflictError(null);
  };

  // Confirm Slot action
  const handleConfirmSlot = () => {
    if (!selectedBookingForModal) return;
    const res = onUpdateBooking({
      ...selectedBookingForModal,
      calendarStatus: 'confirmed',
      workflowColumn: 'confirmed_bookings',
      badgeType: 'drop_off',
      badgeDateStr: `${selectedBookingForModal.date}, ${selectedBookingForModal.startTime}`,
    });

    if (res.success) {
      showToast(`Slot confirmed for ${selectedBookingForModal.vehicleReg}! Moved to Confirmed Bookings.`);
      setSelectedBookingForModal(null);
    } else {
      setRescheduleConflictError(res.error || 'Failed to confirm slot.');
    }
  };

  // Mark Performed action
  const handleMarkPerformed = () => {
    if (!selectedBookingForModal) return;
    const res = onUpdateBooking({
      ...selectedBookingForModal,
      calendarStatus: 'performed',
      workflowColumn: 'service_events_to_book',
      badgeType: 'accepted',
      badgeDateStr: 'Completed & Logged to History',
    });

    if (res.success) {
      showToast(`Service for ${selectedBookingForModal.vehicleReg} marked as Performed!`);
      setSelectedBookingForModal(null);
    } else {
      setRescheduleConflictError(res.error || 'Failed to update.');
    }
  };

  // Cancel Slot action
  const handleCancelSlot = () => {
    if (!selectedBookingForModal) return;
    onCancelBooking(selectedBookingForModal.id);
    showToast(`Slot #${selectedBookingForModal.bookingRef} cancelled.`);
    setSelectedBookingForModal(null);
  };

  // Save reschedule with conflict check
  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForModal) return;

    if (rescheduleStartTime >= rescheduleEndTime) {
      setRescheduleConflictError('End time must be after start time.');
      return;
    }

    const res = onUpdateBooking({
      ...selectedBookingForModal,
      date: rescheduleDate,
      startTime: rescheduleStartTime,
      endTime: rescheduleEndTime,
    });

    if (!res.success) {
      setRescheduleConflictError(res.error || 'Conflict detected.');
    } else {
      showToast(`Rescheduled ${selectedBookingForModal.vehicleReg} to ${rescheduleDate} (${rescheduleStartTime}-${rescheduleEndTime})!`);
      setSelectedBookingForModal(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="fixed top-14 right-6 z-50 bg-[#071322] text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold">{feedbackToast}</span>
        </div>
      )}

      {/* Top Filter and Toolbar Bar matching Screenshot 2026-11-03 171244.png */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Calendar
          </h1>

          {/* All Groups Dropdown */}
          <div className="relative">
            <select
              value={equipmentGroup}
              onChange={(e) => onSetEquipmentGroup(e.target.value)}
              aria-label="Filter calendar by equipment group"
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold py-1.5 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden cursor-pointer"
            >
              <option value="All equipment groups">All Groups</option>
              <option value="SMA-AI-MODULES">SMA-AI-MODULES</option>
              <option value="Intermodal Freight">Intermodal Freight</option>
              <option value="Heavy Haulage">Heavy Haulage</option>
              <option value="Urban Distribution">Urban Distribution</option>
              <option value="Ready-Mix Infrastructure">Ready-Mix Infrastructure</option>
              <option value="Hazardous & Bulk Liquid">Hazardous & Bulk Liquid</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Interactive Colour-Coded Status Filter Blocks matching screenshot */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-md border border-slate-200 overflow-x-auto">
            {(
              [
                { id: 'delayed', label: 'Delayed' },
                { id: 'due', label: 'Due' },
                { id: 'preliminary', label: 'Preliminary' },
                { id: 'performed', label: 'Performed' },
                { id: 'confirmed', label: 'Confirmed' },
                { id: 'planned', label: 'Planned' },
              ] as { id: CalendarStatus; label: string }[]
            ).map((st) => {
              const isActive = statusFilters[st.id];
              const style = statusStyles[st.id];

              return (
                <button
                  key={st.id}
                  onClick={() => onToggleStatusFilter(st.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                    isActive
                      ? `${style.pillBg} ${style.pillText} ring-1 ring-black/10 shadow-2xs`
                      : 'bg-white/60 text-slate-400 opacity-50 hover:opacity-100'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
        </div>

        {/* Right Search & Week/Month View Switcher */}
        <div className="flex items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search registration, service..."
              value={calendarSearch}
              onChange={(e) => setCalendarSearch(e.target.value)}
              className="bg-white border border-slate-200 text-xs py-1.5 pl-3 pr-8 rounded shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48 sm:w-60"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Week / Month Toggle matching screenshot */}
          <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => onSetCalendarViewMode('week')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                calendarViewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onSetCalendarViewMode('month')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                calendarViewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Subheader: `< September 2023, Week 39 >` `Today` */}
      <div className="flex items-center justify-between py-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const d = new Date(calendarDate);
                if (calendarViewMode === 'week') {
                  d.setDate(d.getDate() - 7);
                } else {
                  d.setMonth(d.getMonth() - 1);
                }
                onSetCalendarDate(d);
              }}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Previous period"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm font-bold text-slate-900">
              {calendarViewMode === 'week'
                ? 'September 2023, Week 39'
                : `${monthNames[currentMonth]} ${currentYear}`}
            </span>

            <button
              onClick={() => {
                const d = new Date(calendarDate);
                if (calendarViewMode === 'week') {
                  d.setDate(d.getDate() + 7);
                } else {
                  d.setMonth(d.getMonth() + 1);
                }
                onSetCalendarDate(d);
              }}
              className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Next period"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onSetCalendarDate(new Date('2023-09-26T12:00:00'))}
            className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => onOpenBookingWizard(undefined, '2023-09-26', '08:00')}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#0051a8] hover:bg-[#003d80] px-3 py-1.5 rounded shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Book Garage Slot</span>
        </button>
      </div>

      {/* VIEW 1: 7-Day Vertical Time-Slot Grid (WEEK VIEW) */}
      {calendarViewMode === 'week' ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-x-auto">
          <div className="min-w-[980px]">
            {/* Days Header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-200 bg-white sticky top-0 z-10">
              <div className="py-2.5 px-2 text-center text-xs font-semibold text-slate-400 border-r border-slate-100">
                GMT
              </div>
              {weekDays.map((d) => (
                <div
                  key={d.dateStr}
                  className="py-2.5 px-3 text-left border-r border-slate-100 last:border-r-0"
                >
                  <span className="text-sm font-bold font-mono text-slate-900 mr-1.5">
                    {d.dayNum}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {d.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Slot Rows (07:00 to 17:00) */}
            <div className="relative">
              {hours.map((h) => (
                <div
                  key={h}
                  className="grid grid-cols-[60px_repeat(7,1fr)] h-14 border-b border-slate-100 last:border-b-0"
                >
                  {/* Hour label */}
                  <div className="text-[11px] font-mono font-bold text-slate-400 pr-2 pt-1 text-right border-r border-slate-100 select-none">
                    {h}
                  </div>
                  {/* 7 column slots */}
                  {weekDays.map((d) => {
                    const timeSlot = `${String(h).padStart(2, '0')}:00`;

                    return (
                      <div
                        key={`${h}-${d.dateStr}`}
                        className="border-r border-slate-100 last:border-r-0 hover:bg-blue-50/30 transition-colors cursor-pointer group relative"
                        onClick={() => {
                          onOpenBookingWizard(undefined, d.dateStr, timeSlot);
                        }}
                        title={`Click to book slot on ${d.name} at ${timeSlot}`}
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-700 font-semibold absolute top-1 left-1.5 bg-white/95 px-1.5 py-0.5 rounded shadow-2xs pointer-events-none transition-opacity">
                          + Book {timeSlot}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Absolute Positioned Event Blocks */}
              <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)] pointer-events-none">
                <div className="border-r border-transparent" />
                {weekDays.map((d) => {
                  const dayBookings = calendarBookings.filter((b) => b.date === d.dateStr);

                  return (
                    <div key={`col-${d.dateStr}`} className="relative h-full pointer-events-auto px-1">
                      {dayBookings.map((b) => {
                        const top = calculateTopOffset(b.startTime);
                        const height = calculateBlockHeight(b.startTime, b.endTime);
                        const style = statusStyles[b.calendarStatus];

                        return (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEventModal(b);
                            }}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                            }}
                            className={`absolute left-1 right-1 rounded border p-2 flex flex-col justify-between shadow-xs transition-all hover:shadow-md cursor-pointer z-10 ${style.bg} ${style.border}`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className={`text-[11px] font-bold ${style.text} capitalize truncate`}>
                                  {b.calendarStatus} <span className="font-mono text-slate-900">{b.vehicleReg}</span>
                                </span>
                              </div>

                              <p className="text-[10px] text-slate-700 font-medium leading-tight line-clamp-2">
                                {b.serviceActivities}
                              </p>

                              <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                {b.workshopLocation}
                              </p>
                            </div>

                            <div className="text-[9px] font-mono font-semibold text-slate-600 mt-1 flex items-center justify-between">
                              <span>
                                {b.startTime} - {b.endTime}
                              </span>
                              <span className="text-[9px] uppercase font-bold text-slate-500">
                                {b.equipmentGroup.split(' ')[0]}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: Full Monthly Grid (MONTH VIEW) */
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-2">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[110px] bg-slate-50/40 rounded border border-transparent p-2 text-slate-300 text-xs" />
            ))}

            {/* Month Day Cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayBookings = calendarBookings.filter((b) => b.date === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => onOpenBookingWizard(undefined, dateStr, '08:30')}
                  className="min-h-[110px] p-2 bg-white rounded border border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {dayNum}
                    </span>
                    {dayBookings.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-700 font-mono bg-blue-50 px-1.5 rounded">
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-[75px]">
                    {dayBookings.map((b) => {
                      const style = statusStyles[b.calendarStatus];

                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEventModal(b);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate border ${style.bg} ${style.text} ${style.border} hover:brightness-95`}
                        >
                          <span className="font-mono font-bold mr-1">{b.vehicleReg}</span>
                          <span>{b.startTime}</span>
                        </div>
                      );
                    })}
                  </div>

                  <span className="text-[9px] text-slate-400 group-hover:text-blue-600 transition-colors">
                    + Book slot
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Event Management & Conflict Validation Modal */}
      {selectedBookingForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#071322] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  Service Appointment #{selectedBookingForModal.bookingRef}
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedBookingForModal.vehicleReg} · {selectedBookingForModal.vehicleModel}
                </h3>
              </div>

              <button
                onClick={() => setSelectedBookingForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSaveReschedule} className="p-5 space-y-4 text-xs">
              {rescheduleConflictError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="leading-snug">{rescheduleConflictError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Workshop Center
                  </label>
                  <p className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                    {selectedBookingForModal.workshopLocation}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Current Status & Column
                  </label>
                  <p className="font-semibold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 capitalize">
                    {selectedBookingForModal.calendarStatus} · {selectedBookingForModal.workflowColumn.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Service Checklist
                </label>
                <p className="font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
                  {selectedBookingForModal.serviceActivities}
                </p>
              </div>

              {/* Reschedule Date and Times */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 block">
                  Reschedule / Bay Appointment Slot
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      required
                      value={rescheduleDate}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value);
                        setRescheduleConflictError(null);
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleStartTime}
                      onChange={(e) => {
                        setRescheduleStartTime(e.target.value);
                        setRescheduleConflictError(null);
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleEndTime}
                      onChange={(e) => {
                        setRescheduleEndTime(e.target.value);
                        setRescheduleConflictError(null);
                      }}
                      className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {/* CONFIRM SLOT BUTTON */}
                  <button
                    type="button"
                    onClick={handleConfirmSlot}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors shadow-2xs"
                  >
                    Confirm Slot
                  </button>

                  {/* MARK PERFORMED BUTTON */}
                  <button
                    type="button"
                    onClick={handleMarkPerformed}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                  >
                    Mark Performed
                  </button>

                  {/* CANCEL SLOT BUTTON */}
                  <button
                    type="button"
                    onClick={handleCancelSlot}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-300 transition-colors"
                  >
                    Cancel Slot
                  </button>

                  {onOpenJobMaterials && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = selectedBookingForModal.id;
                        setSelectedBookingForModal(null);
                        onOpenJobMaterials(id);
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-[#0051a8] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                    >
                      Materials / Invoice
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBookingForModal(null)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs"
                  >
                    Save Reschedule
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
