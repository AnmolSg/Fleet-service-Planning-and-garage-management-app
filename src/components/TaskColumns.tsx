import React, { useState } from 'react';
import {
  BeverageCategory,
  GroupByMode,
  HydrationTask,
  TaskStatus,
  TimeSection,
} from '../types/hydration';
import {
  Info,
  Plus,
  Check,
  Droplets,
  Wine,
  Sparkles,
  CupSoda,
  Coffee,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

interface TaskColumnsProps {
  tasks: HydrationTask[];
  groupByMode: GroupByMode;
  onAddWaterToTask: (taskId: string, ml: number) => void;
  onCompleteTask: (taskId: string) => void;
  onSetStatus: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenCreateTaskModal: (defaultSection: TimeSection) => void;
  selectedDate: string;
}

export const TaskColumns: React.FC<TaskColumnsProps> = ({
  tasks,
  groupByMode,
  onAddWaterToTask,
  onCompleteTask,
  onDeleteTask,
  onOpenCreateTaskModal,
}) => {
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  // Time Sections definition
  const timeSections: { id: TimeSection; title: string; subtitle: string; hours: string; targetShare: string }[] = [
    {
      id: 'morning',
      title: 'Morning Wake & Prime',
      subtitle: 'Cellular flush & metabolic activation',
      hours: '06:00 - 10:00',
      targetShare: '750 - 1,000 ml',
    },
    {
      id: 'midday',
      title: 'Midday Focus & Fuel',
      subtitle: 'Cognitive sustained focus & digestion',
      hours: '10:00 - 14:00',
      targetShare: '800 - 1,000 ml',
    },
    {
      id: 'afternoon',
      title: 'Afternoon Peak & Active',
      subtitle: 'Intra-workout & slump prevention',
      hours: '14:00 - 18:00',
      targetShare: '800 - 1,000 ml',
    },
    {
      id: 'evening',
      title: 'Evening Restore & Rest',
      subtitle: 'Calm herbal replenishment before sleep',
      hours: '18:00 - 22:00',
      targetShare: '400 - 600 ml',
    },
  ];

  // Status Columns definition
  const statusSections: { id: TaskStatus; title: string; subtitle: string; color: string }[] = [
    {
      id: 'scheduled',
      title: 'Scheduled Sips',
      subtitle: 'Upcoming targets for today',
      color: 'border-slate-300',
    },
    {
      id: 'in_progress',
      title: 'Active Drinking Sessions',
      subtitle: 'Currently sipping from bottle',
      color: 'border-cyan-400',
    },
    {
      id: 'completed',
      title: 'Logged & Completed',
      subtitle: 'Targets fully reached',
      color: 'border-emerald-500',
    },
    {
      id: 'delayed',
      title: 'Delayed / Catch-up Needed',
      subtitle: 'Missed schedule window',
      color: 'border-rose-400',
    },
  ];

  const getBeverageIcon = (category: BeverageCategory) => {
    switch (category) {
      case 'tea':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'sparkling':
        return <Sparkles className="w-4 h-4 text-cyan-500" />;
      case 'electrolyte':
        return <CupSoda className="w-4 h-4 text-orange-500" />;
      case 'infusion':
        return <Wine className="w-4 h-4 text-purple-500" />;
      default:
        return <Droplets className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: TaskStatus, scheduledTime: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Completed</span>
            <span className="text-slate-400 font-mono text-[11px]">{scheduledTime}</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>In Progress</span>
            <span className="text-slate-400 font-mono text-[11px]">{scheduledTime}</span>
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Delayed</span>
            <span className="text-slate-400 font-mono text-[11px]">{scheduledTime}</span>
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Pending</span>
            <span className="text-slate-400 font-mono text-[11px]">{scheduledTime}</span>
          </span>
        );
    }
  };

  // Render cards for a section
  const renderCardList = (sectionTasks: HydrationTask[], defaultSection: TimeSection) => {
    if (sectionTasks.length === 0) {
      return (
        <div className="bg-white rounded-md border border-dashed border-slate-200 p-6 text-center flex flex-col items-center justify-center min-h-[140px]">
          <Droplets className="w-6 h-6 text-slate-300 mb-1" />
          <p className="text-xs text-slate-400 mb-2">No hydration tasks in this stage</p>
          <button
            onClick={() => onOpenCreateTaskModal(defaultSection)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sectionTasks.map((task) => {
          const progressPercent = Math.min(
            100,
            Math.round((task.loggedMl / task.targetMl) * 100)
          );

          return (
            <div
              key={task.id}
              className="bg-white rounded-md border border-slate-200 p-3 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all group"
            >
              {/* Header row with bottle thumbnail, Code and title */}
              <div className="flex items-start gap-2.5 mb-2">
                {/* Bottle silhouette container matching vehicle thumbnail from screenshot */}
                <div className="w-12 h-10 rounded bg-slate-100 border border-slate-200/80 flex items-center justify-center shrink-0 p-1">
                  {getBeverageIcon(task.beverageCategory)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold font-mono text-slate-900 tracking-tight truncate">
                      {task.code}
                    </span>
                    {task.isPriority && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="High Priority Hydration Target" />
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {task.description}
                  </p>
                </div>
              </div>

              {/* Beverage & Bottle info */}
              <div className="text-[11px] text-slate-600 mb-2 flex items-center justify-between">
                <span className="capitalize">{task.beverageCategory} · {task.bottleName}</span>
                <span className="font-mono tabular-nums text-slate-900 font-medium">
                  {task.loggedMl} / {task.targetMl} ml
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPercent >= 100
                      ? 'bg-emerald-500'
                      : progressPercent > 0
                      ? 'bg-cyan-500'
                      : 'bg-slate-200'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Footer status & Action controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {getStatusBadge(task.status, task.scheduledTime)}

                <div className="flex items-center gap-1">
                  {/* Quick +100ml */}
                  <button
                    onClick={() => onAddWaterToTask(task.id, 100)}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 rounded border border-slate-200 transition-colors"
                    title="Add 100ml"
                  >
                    +100
                  </button>

                  {/* Quick +250ml */}
                  <button
                    onClick={() => onAddWaterToTask(task.id, 250)}
                    className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 hover:bg-cyan-100 text-slate-700 hover:text-cyan-800 rounded border border-slate-200 transition-colors"
                    title="Add 250ml glass"
                  >
                    +250
                  </button>

                  {/* Mark complete */}
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Mark Goal Completed"
                      aria-label="Complete task"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove task"
                    aria-label="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {groupByMode === 'sections'
        ? timeSections.map((sec) => {
            const sectionTasks = tasks.filter((t) => t.timeSection === sec.id);
            const totalLogged = sectionTasks.reduce((s, t) => s + t.loggedMl, 0);
            const totalTarget = sectionTasks.reduce((s, t) => s + t.targetMl, 0);

            return (
              <div key={sec.id} className="flex flex-col">
                {/* Column Header matching screenshot style with grey pill & info icon */}
                <div className="bg-[#e9edf2] text-slate-800 px-3 py-2 rounded-t-md border border-slate-300/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {sec.title}
                    </span>
                    <span className="bg-white text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {sectionTasks.length}
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onMouseEnter={() => setHoveredInfo(sec.id)}
                      onMouseLeave={() => setHoveredInfo(null)}
                      className="text-slate-500 hover:text-slate-800 transition-colors"
                      aria-label="Section info"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>

                    {hoveredInfo === sec.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 text-white text-[11px] p-2 rounded shadow-xl z-30 pointer-events-none">
                        <p className="font-semibold text-cyan-300">{sec.subtitle}</p>
                        <p className="text-slate-300 mt-1">Recommended window: {sec.hours}</p>
                        <p className="text-slate-400">Target intake: {sec.targetShare}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-header metric bar */}
                <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] text-slate-500 flex items-center justify-between border-x border-slate-200 font-mono">
                  <span>{sec.hours}</span>
                  <span className="font-semibold text-slate-800">
                    {totalLogged} / {totalTarget} ml
                  </span>
                </div>

                {/* Card Container */}
                <div className="bg-[#f4f6f9] p-2.5 rounded-b-md border border-t-0 border-slate-200 flex-1 min-h-[300px]">
                  {renderCardList(sectionTasks, sec.id)}

                  {/* Add task button at bottom of section */}
                  <button
                    onClick={() => onOpenCreateTaskModal(sec.id)}
                    className="w-full mt-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded transition-colors flex items-center justify-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task to {sec.title.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            );
          })
        : statusSections.map((sec) => {
            const sectionTasks = tasks.filter((t) => t.status === sec.id);

            return (
              <div key={sec.id} className="flex flex-col">
                {/* Column Header for status mode */}
                <div className="bg-[#e9edf2] text-slate-800 px-3 py-2 rounded-t-md border border-slate-300/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {sec.title}
                    </span>
                    <span className="bg-white text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono">
                      {sectionTasks.length}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 font-mono">
                    {sectionTasks.reduce((acc, t) => acc + t.loggedMl, 0)} ml
                  </span>
                </div>

                {/* Card Container */}
                <div className="bg-[#f4f6f9] p-2.5 rounded-b-md border border-t-0 border-slate-200 flex-1 min-h-[300px]">
                  {renderCardList(sectionTasks, 'morning')}
                </div>
              </div>
            );
          })}
    </div>
  );
};
