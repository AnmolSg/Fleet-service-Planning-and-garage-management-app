import React, { useState } from 'react';
import { BeverageCategory, BottlePreset, TimeSection } from '../types/hydration';
import { X, Droplets, Wine, Sparkles, CupSoda, Coffee, Plus } from 'lucide-react';

interface LogWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bottles: BottlePreset[];
  onQuickLog: (amountMl: number, section: TimeSection, beverage: BeverageCategory, bottleName: string) => void;
  onAddNewTask: (taskData: any) => void;
  defaultSection?: TimeSection;
  mode?: 'quick_log' | 'create_task';
}

export const LogWaterModal: React.FC<LogWaterModalProps> = ({
  isOpen,
  onClose,
  bottles,
  onQuickLog,
  onAddNewTask,
  defaultSection = 'midday',
  mode = 'quick_log',
}) => {
  const [activeTab, setActiveTab] = useState<'quick_log' | 'create_task'>(mode);
  const [selectedBottle, setSelectedBottle] = useState<BottlePreset>(bottles[0] || {
    id: 'b1',
    name: 'Standard Tumbler',
    volumeMl: 250,
    iconType: 'glass',
    description: 'Quick 1-cup hydration sip',
  });
  const [customMl, setCustomMl] = useState<number>(250);
  const [beverage, setBeverage] = useState<BeverageCategory>('water');
  const [section, setSection] = useState<TimeSection>(defaultSection);
  const [temperature, setTemperature] = useState<'chilled' | 'room' | 'warm'>('room');
  const [notes, setNotes] = useState<string>('');

  // Task creation fields
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('12:00');
  const [isPriority, setIsPriority] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleBottleClick = (b: BottlePreset) => {
    setSelectedBottle(b);
    setCustomMl(b.volumeMl);
  };

  const handleQuickLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickLog(customMl, section, beverage, selectedBottle.name);
    onClose();
  };

  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const timeCode = scheduledTime.replace(':', '');
    onAddNewTask({
      code: `HYD-${timeCode}`,
      title: taskTitle.trim() || `${beverage.toUpperCase()} Drink Session`,
      description: notes.trim() || `Scheduled ${customMl}ml from ${selectedBottle.name}`,
      timeSection: section,
      status: 'scheduled',
      targetMl: customMl,
      loggedMl: 0,
      scheduledTime,
      beverageCategory: beverage,
      bottleName: selectedBottle.name,
      temperature,
      isPriority,
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide">
                {activeTab === 'quick_log' ? 'LOG WATER INTAKE' : 'SCHEDULE NEW INTAKE TASK'}
              </h3>
              <p className="text-[11px] text-slate-400">Record water intake to your daily tracker</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2">
          <button
            onClick={() => setActiveTab('quick_log')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'quick_log'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Quick Intake Log
          </button>
          <button
            onClick={() => setActiveTab('create_task')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'create_task'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Schedule Daily Task
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {activeTab === 'quick_log' ? (
            <form onSubmit={handleQuickLogSubmit} className="space-y-4">
              {/* Bottle Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Select Container / Bottle
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {bottles.map((b) => {
                    const isSelected = selectedBottle.id === b.id;
                    return (
                      <button
                        type="button"
                        key={b.id}
                        onClick={() => handleBottleClick(b)}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? 'border-cyan-600 bg-cyan-50/50 ring-1 ring-cyan-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Wine className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-600' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {b.volumeMl}ml
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Slider / Custom Ml */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Volume Amount
                  </label>
                  <span className="text-sm font-mono font-bold text-cyan-700">
                    {customMl} ml
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={customMl}
                  onChange={(e) => setCustomMl(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>50ml</span>
                  <span>250ml</span>
                  <span>500ml</span>
                  <span>750ml</span>
                  <span>1000ml</span>
                  <span>1500ml</span>
                </div>
              </div>

              {/* 4 Separate Sections Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Assign to Task Section
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSection('morning')}
                    className={`px-3 py-2 rounded border text-left text-xs font-medium transition-all ${
                      section === 'morning'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🌅 Morning (06:00 - 10:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('midday')}
                    className={`px-3 py-2 rounded border text-left text-xs font-medium transition-all ${
                      section === 'midday'
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ☀️ Midday (10:00 - 14:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('afternoon')}
                    className={`px-3 py-2 rounded border text-left text-xs font-medium transition-all ${
                      section === 'afternoon'
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ⚡ Afternoon (14:00 - 18:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSection('evening')}
                    className={`px-3 py-2 rounded border text-left text-xs font-medium transition-all ${
                      section === 'evening'
                        ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    🌙 Evening (18:00 - 22:00)
                  </button>
                </div>
              </div>

              {/* Beverage Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Beverage Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['water', 'electrolyte', 'tea', 'sparkling', 'infusion', 'smoothie'] as BeverageCategory[]).map(
                    (cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setBeverage(cat)}
                        className={`px-2.5 py-1.5 rounded border text-xs capitalize transition-colors ${
                          beverage === cat
                            ? 'border-slate-800 bg-slate-900 text-white font-semibold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded shadow-sm transition-all"
                >
                  Confirm & Log {customMl}ml
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Post-Workout Electrolyte Flask"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Volume (ml)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="25"
                    value={customMl}
                    onChange={(e) => setCustomMl(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Section Bucket
                </label>
                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value as TimeSection)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                >
                  <option value="morning">Morning Wake & Prime (06:00 - 10:00)</option>
                  <option value="midday">Midday Focus & Fuel (10:00 - 14:00)</option>
                  <option value="afternoon">Afternoon Peak & Active (14:00 - 18:00)</option>
                  <option value="evening">Evening Restore & Rest (18:00 - 22:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Optional Notes / Ingredients
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Add 1 scoop unflavored electrolytes and slice of cucumber"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="priority-check"
                  checked={isPriority}
                  onChange={(e) => setIsPriority(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="priority-check" className="text-xs text-slate-700 font-medium">
                  Mark as High Priority Hydration Target
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded border border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-sm transition-all"
                >
                  Add Scheduled Task
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
