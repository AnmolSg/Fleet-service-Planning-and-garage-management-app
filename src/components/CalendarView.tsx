import React, { useState } from 'react';
import { DayHydrationRecord, TimeSection } from '../types/hydration';
import { formatDateKey } from '../data/initialData';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Droplets,
  Plus,
  RefreshCw,
} from 'lucide-react';

interface CalendarViewProps {
  records: Record<string, DayHydrationRecord>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onOpenQuickLog: () => void;
  dailyGoalMl: number;
  streakCount: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  records,
  selectedDate,
  onSelectDate,
  onOpenQuickLog,
  dailyGoalMl,
  streakCount,
}) => {
  // Calendar current browsing month
  const [currentBrowseDate, setCurrentBrowseDate] = useState(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const year = currentBrowseDate.getFullYear();
  const month = currentBrowseDate.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate days in month
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Navigation
  const prevMonth = () => {
    setCurrentBrowseDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentBrowseDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentBrowseDate(new Date(today.getFullYear(), today.getMonth(), 1));
    onSelectDate(formatDateKey(today));
  };

  // Inspect selected day record
  const activeRecord = records[selectedDate];
  const activeTasks = activeRecord?.tasks || [];
  const activeLogged = activeRecord?.loggedTotalMl || 0;
  const activeTarget = activeRecord?.targetTotalMl || dailyGoalMl;
  const activePercent = Math.min(100, Math.round((activeLogged / activeTarget) * 100));

  // Monthly statistics
  let monthTotalLogged = 0;
  let monthDaysMet = 0;
  let monthLoggedCount = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = records[key];
    if (rec && rec.loggedTotalMl > 0) {
      monthTotalLogged += rec.loggedTotalMl;
      monthLoggedCount++;
      if (rec.loggedTotalMl >= rec.targetTotalMl * 0.9) {
        monthDaysMet++;
      }
    }
  }

  const monthAverageDaily = monthLoggedCount > 0 ? Math.round(monthTotalLogged / monthLoggedCount) : 0;
  const monthSuccessRate = monthLoggedCount > 0 ? Math.round((monthDaysMet / monthLoggedCount) * 100) : 0;

  // 4 sections breakdown for selected date
  const sections: { id: TimeSection; label: string; color: string }[] = [
    { id: 'morning', label: 'Morning (06-10)', color: 'bg-amber-400' },
    { id: 'midday', label: 'Midday (10-14)', color: 'bg-cyan-500' },
    { id: 'afternoon', label: 'Afternoon (14-18)', color: 'bg-blue-600' },
    { id: 'evening', label: 'Evening (18-22)', color: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Monthly KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Monthly Average
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {monthAverageDaily.toLocaleString()} <span className="text-xs font-normal text-slate-500">ml/day</span>
          </div>
          <div className="text-[11px] text-cyan-600 font-medium mt-0.5">
            {Math.round((monthAverageDaily / dailyGoalMl) * 100)}% of daily target
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Target Completion
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            {monthSuccessRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {monthDaysMet} of {monthLoggedCount} tracked days
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Water Tracked
          </div>
          <div className="text-xl font-bold font-mono text-blue-600 mt-1">
            {(monthTotalLogged / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-500">Liters</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            In {monthNames[month]} {year}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <span>Hydration Streak</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            {streakCount} <span className="text-xs font-normal text-slate-500">consecutive days</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            Active streak record 🔥
          </div>
        </div>
      </div>

      {/* Main Calendar + Day Inspection Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Calendar Matrix */}
        <div className="xl:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <button
                onClick={goToToday}
                className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 pt-2">
            {/* Leading days from previous month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="min-h-[86px] p-1.5 bg-slate-50/50 rounded border border-transparent text-slate-300 opacity-40 select-none text-right text-xs"
                >
                  <span>{dayNum}</span>
                </div>
              );
            })}

            {/* Days in current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const record = records[dateKey];
              const isSelected = selectedDate === dateKey;
              const isToday = formatDateKey(new Date()) === dateKey;

              const logged = record?.loggedTotalMl || 0;
              const target = record?.targetTotalMl || dailyGoalMl;
              const percent = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
              const isMet = percent >= 90;

              // Section micro-pills count
              const morningDone = record?.tasks.some((t) => t.timeSection === 'morning' && t.loggedMl > 0);
              const middayDone = record?.tasks.some((t) => t.timeSection === 'midday' && t.loggedMl > 0);
              const afternoonDone = record?.tasks.some((t) => t.timeSection === 'afternoon' && t.loggedMl > 0);
              const eveningDone = record?.tasks.some((t) => t.timeSection === 'evening' && t.loggedMl > 0);

              return (
                <button
                  key={dateKey}
                  onClick={() => onSelectDate(dateKey)}
                  className={`min-h-[92px] p-2 rounded border text-left flex flex-col justify-between transition-all group relative ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/30 z-10'
                      : isToday
                      ? 'border-cyan-400 bg-cyan-50/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'bg-cyan-600 text-white w-5 h-5 rounded-full flex items-center justify-center'
                          : isSelected
                          ? 'text-blue-700 font-extrabold'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {logged > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold ${
                          isMet ? 'text-emerald-600' : 'text-slate-500'
                        }`}
                      >
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Logged ml badge */}
                  <div className="my-1">
                    {logged > 0 ? (
                      <div className="text-[11px] font-mono font-semibold text-slate-800">
                        {logged} <span className="text-[9px] font-normal text-slate-400">ml</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300 font-sans italic">
                        No intake
                      </div>
                    )}

                    {/* Mini progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMet ? 'bg-emerald-500' : logged > 0 ? 'bg-cyan-500' : 'bg-transparent'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* 4 Sections mini dot status indicators */}
                  <div className="flex items-center gap-1 pt-1 border-t border-slate-100/80 w-full" title="4 Section coverage: Morning, Midday, Afternoon, Evening">
                    <span className={`w-1.5 h-1.5 rounded-full ${morningDone ? 'bg-amber-400' : 'bg-slate-200'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${middayDone ? 'bg-cyan-500' : 'bg-slate-200'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${afternoonDone ? 'bg-blue-600' : 'bg-slate-200'}`} />
                    <span className={`w-1.5 h-1.5 rounded-full ${eveningDone ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Target met (&gt;90%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span>Partial intake</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>Scheduled / Untracked</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400">4 dots:</span>
              <span className="text-amber-600">Morn</span>
              <span className="text-cyan-600">Mid</span>
              <span className="text-blue-600">Aft</span>
              <span className="text-indigo-600">Eve</span>
            </div>
          </div>
        </div>

        {/* Right Col: Deep Day Inspector Drawer */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Header for Day Inspector */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider font-mono">
                  {selectedDate === formatDateKey(new Date()) ? 'TODAY RECORD' : 'DATE INSPECTION'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h3>
              </div>

              <button
                onClick={onOpenQuickLog}
                className="flex items-center gap-1 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white px-2.5 py-1.5 rounded transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log to Day</span>
              </button>
            </div>

            {/* Daily Total Progress */}
            <div className="my-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">Daily Water Progress</span>
                <span className="text-sm font-bold font-mono text-slate-900">
                  {activeLogged} / {activeTarget} ml ({activePercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    activePercent >= 90 ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${activePercent}%` }}
                />
              </div>
            </div>

            {/* 4 Separate Sections breakdown for this day */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>4 Stage Breakdown</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {activeTasks.length} tasks scheduled
                </span>
              </div>

              {sections.map((sec) => {
                const secTasks = activeTasks.filter((t) => t.timeSection === sec.id);
                const logged = secTasks.reduce((s, t) => s + t.loggedMl, 0);
                const target = secTasks.reduce((s, t) => s + t.targetMl, 0);

                return (
                  <div
                    key={sec.id}
                    className="p-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sec.color}`} />
                        <span className="text-xs font-semibold text-slate-800">
                          {sec.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-700 font-medium">
                        {logged} / {target} ml
                      </span>
                    </div>

                    {/* Tasks mini preview */}
                    {secTasks.length > 0 ? (
                      <div className="text-[11px] text-slate-500 truncate mt-1">
                        {secTasks.map((t) => t.title).join(' · ')}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic mt-1">
                        No intake scheduled
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick guidance footer */}
          <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
            <p>
              Switch back to <strong>Overview</strong> to manage the 4 task columns directly or re-schedule specific tasks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
