import React from 'react';
import { ViewMode } from '../types/hydration';
import {
  LayoutGrid,
  Calendar,
  CheckSquare,
  Droplet,
  AlertTriangle,
  Wine,
  Settings,
  Code2,
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  unreadCount,
}) => {
  const navItems = [
    {
      id: 'overview' as ViewMode,
      icon: LayoutGrid,
      label: 'Overview & 4 Sections',
    },
    {
      id: 'calendar' as ViewMode,
      icon: Calendar,
      label: 'Calendar Tracking',
    },
    {
      id: 'tasks' as ViewMode,
      icon: CheckSquare,
      label: 'Intake Task Checklist',
    },
    {
      id: 'bottles' as ViewMode,
      icon: Wine,
      label: 'Bottles & Volumes',
    },
    {
      id: 'analytics' as ViewMode,
      icon: Droplet,
      label: 'Hydration Analytics',
    },
    {
      id: 'settings' as ViewMode,
      icon: Settings,
      label: 'Daily Targets & Config',
    },
    {
      id: 'angular_code' as ViewMode,
      icon: Code2,
      label: 'Angular 19 Source Code',
      badge: 'NG',
    },
  ];

  return (
    <aside className="w-14 lg:w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 justify-between shrink-0 select-none z-20">
      <div className="flex flex-col items-center gap-2 w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isAlert = item.id === 'overview' && unreadCount > 0;

          return (
            <div key={item.id} className="relative group w-full flex justify-center px-2">
              <button
                onClick={() => onSelectView(item.id)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
                aria-label={item.label}
              >
                <Icon className="w-5 h-5 stroke-[1.75]" />

                {/* Badge if Angular */}
                {item.badge && (
                  <span className="absolute -bottom-1 -right-1 bg-red-600 text-[9px] font-bold text-white px-1 rounded font-mono">
                    {item.badge}
                  </span>
                )}

                {/* Alert badge if needed */}
                {item.id === 'overview' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Tooltip on hover */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom status indicator */}
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <div className="w-2 h-2 rounded-full bg-emerald-500" title="System synced locally" />
        <span className="text-[10px] font-mono font-semibold tracking-tighter">v2.4</span>
      </div>
    </aside>
  );
};
