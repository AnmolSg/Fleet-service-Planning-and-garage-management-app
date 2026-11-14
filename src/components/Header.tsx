import React from 'react';
import { ViewMode } from '../types/hydration';
import { Droplets, Bell, Code2, Calendar, LayoutGrid, CheckSquare, Wine } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  unreadAlertsCount: number;
  streakCount: number;
  todayTotalMl: number;
  dailyGoalMl: number;
  onOpenQuickLog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  unreadAlertsCount,
  streakCount,
  todayTotalMl,
  dailyGoalMl,
  onOpenQuickLog,
}) => {
  const percent = Math.min(100, Math.round((todayTotalMl / dailyGoalMl) * 100));

  return (
    <header className="bg-[#0b1728] text-white px-4 lg:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Zone 1: Brand & Wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-wider text-sm lg:text-base uppercase whitespace-nowrap">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
            <Droplets className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
          <span className="font-extrabold text-white tracking-widest text-xs lg:text-sm">
            HYDRO SERVICE & INTAKE
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-2">
        <button
          onClick={() => onSelectView('overview')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
            currentView === 'overview'
              ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => onSelectView('calendar')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
            currentView === 'calendar'
              ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => onSelectView('tasks')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
            currentView === 'tasks'
              ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Tasks & Intake</span>
        </button>

        <button
          onClick={() => onSelectView('bottles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-semibold tracking-wide uppercase transition-colors whitespace-nowrap ${
            currentView === 'bottles'
              ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Wine className="w-3.5 h-3.5" />
          <span>Bottles</span>
        </button>

        <button
          onClick={() => onSelectView('angular_code')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold tracking-wide transition-colors whitespace-nowrap border ${
            currentView === 'angular_code'
              ? 'bg-red-500/20 text-red-300 border-red-500/40'
              : 'bg-red-950/30 text-red-200 border-red-800/40 hover:bg-red-900/40'
          }`}
          title="Inspect full standalone Angular 19 codebase"
        >
          <Code2 className="w-3.5 h-3.5 text-red-400" />
          <span className="font-mono text-[11px] font-bold">Angular Source</span>
        </button>
      </nav>

      {/* Zone 3: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick Log CTA */}
        <button
          onClick={onOpenQuickLog}
          className="hidden sm:flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition-all active:scale-95 whitespace-nowrap"
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Quick Log</span>
        </button>

        {/* Streak counter */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono tabular-nums text-amber-300" title="Hydration streak">
          <span className="text-amber-400">🔥</span>
          <span className="font-bold">{streakCount}d</span>
          <span className="text-slate-400 text-[10px]">streak</span>
        </div>

        {/* Today's gauge */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono tabular-nums">
          <span>{todayTotalMl} / {dailyGoalMl}ml</span>
          <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-cyan-300 font-bold text-[11px]">{percent}%</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => onSelectView('overview')}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0b1728]" />
            )}
          </button>
        </div>

        {/* User avatar matching screenshot (Navy circle with initial) */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-white text-xs font-bold border border-cyan-400/40">
            H
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-slate-200">
            Hydro Manager
          </span>
        </div>
      </div>
    </header>
  );
};
