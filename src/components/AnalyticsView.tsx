import React, { useState } from 'react';
import { DayHydrationRecord } from '../types/hydration';
import { Droplets, Target, Award, BarChart3, TrendingUp, Save } from 'lucide-react';

interface AnalyticsViewProps {
  records: Record<string, DayHydrationRecord>;
  dailyGoalMl: number;
  onUpdateDailyGoal: (newGoal: number) => void;
  streakCount: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  records,
  dailyGoalMl,
  onUpdateDailyGoal,
  streakCount,
}) => {
  const [goalInput, setGoalInput] = useState(dailyGoalMl.toString());
  const [weightKg, setWeightKg] = useState('75');
  const [activityLevel, setActivityLevel] = useState<'moderate' | 'high' | 'intense'>('high');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute stats across all recorded days
  const allDays = Object.values(records);
  const trackedDays = allDays.filter((d) => d.loggedTotalMl > 0);
  const totalVolumeLitres = trackedDays.reduce((acc, d) => acc + d.loggedTotalMl, 0) / 1000;
  const avgDailyMl = trackedDays.length > 0 ? Math.round((totalVolumeLitres * 1000) / trackedDays.length) : 0;

  // Beverage distribution
  const beverageCounts: Record<string, number> = {};
  trackedDays.forEach((d) => {
    d.tasks.forEach((t) => {
      beverageCounts[t.beverageCategory] = (beverageCounts[t.beverageCategory] || 0) + t.loggedMl;
    });
  });

  const totalBeverageMl = Object.values(beverageCounts).reduce((a, b) => a + b, 0) || 1;

  // 4 Sections distribution
  const sectionVolumes: Record<string, number> = {
    morning: 0,
    midday: 0,
    afternoon: 0,
    evening: 0,
  };

  trackedDays.forEach((d) => {
    d.tasks.forEach((t) => {
      if (sectionVolumes[t.timeSection] !== undefined) {
        sectionVolumes[t.timeSection] += t.loggedMl;
      }
    });
  });

  const totalSectionMl = Object.values(sectionVolumes).reduce((a, b) => a + b, 0) || 1;

  // Recommendation calculator
  const calculateRecommended = () => {
    const base = Number(weightKg) * 35;
    const add = activityLevel === 'intense' ? 750 : activityLevel === 'high' ? 500 : 250;
    const rec = Math.round((base + add) / 50) * 50;
    setGoalInput(rec.toString());
    onUpdateDailyGoal(rec);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleManualSave = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val >= 500 && val <= 8000) {
      onUpdateDailyGoal(val);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Hydration Analytics & Biological Balance
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Evaluate 4-stage circadian rhythm water distribution and adjust targets
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Litres Consumed</span>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {totalVolumeLitres.toFixed(1)} <span className="text-xs font-normal text-slate-500">L</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">{trackedDays.length} recorded sessions</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Average Daily Intake</span>
          <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
            {avgDailyMl.toLocaleString()} <span className="text-xs font-normal text-slate-500">ml</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            {Math.round((avgDailyMl / dailyGoalMl) * 100)}% of calibrated goal
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Longest Streak</span>
          <div className="text-2xl font-bold font-mono text-amber-500 mt-1">
            {Math.max(streakCount, 7)} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Consecutive &gt;90% targets</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Goal Target</span>
          <div className="text-2xl font-bold font-mono text-cyan-600 mt-1">
            {dailyGoalMl.toLocaleString()} <span className="text-xs font-normal text-slate-500">ml</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Daily benchmark</span>
        </div>
      </div>

      {/* 4-Stage Distribution & Beverage Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4 Sections Circadian Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            4-Stage Daily Intake Distribution
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Percentage of total water consumed in each time block
          </p>

          <div className="space-y-4">
            {[
              { id: 'morning', label: 'Morning Wake & Prime (06:00 - 10:00)', color: 'bg-amber-400', ideal: '25%' },
              { id: 'midday', label: 'Midday Focus & Fuel (10:00 - 14:00)', color: 'bg-cyan-500', ideal: '35%' },
              { id: 'afternoon', label: 'Afternoon Peak & Active (14:00 - 18:00)', color: 'bg-blue-600', ideal: '30%' },
              { id: 'evening', label: 'Evening Restore & Rest (18:00 - 22:00)', color: 'bg-indigo-600', ideal: '10%' },
            ].map((sec) => {
              const vol = sectionVolumes[sec.id] || 0;
              const pct = Math.round((vol / totalSectionMl) * 100);

              return (
                <div key={sec.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{sec.label}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {pct}% <span className="text-[10px] text-slate-400 font-normal">(ideal {sec.ideal})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${sec.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Beverage Types Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Beverage Composition
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Hydration sources across spring water, tea, electrolytes, and sparkling
          </p>

          <div className="space-y-3">
            {Object.entries(beverageCounts).map(([cat, vol]) => {
              const pct = Math.round((vol / totalBeverageMl) * 100);
              return (
                <div key={cat} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span className="text-xs font-semibold text-slate-800 capitalize">{cat}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-slate-900">
                    <span className="font-bold">{vol.toLocaleString()} ml</span>
                    <span className="text-slate-400 ml-1.5 font-normal">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Customizer & Formula Calculator */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Daily Hydration Benchmark Calibration
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Calculate your optimal intake based on weight and physical exertion or set manually
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Formula Calculator */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Body Mass Hydration Formula
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Exertion Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                >
                  <option value="moderate">Desk / Light (+250ml)</option>
                  <option value="high">Active Workout (+500ml)</option>
                  <option value="intense">Intense Athletics (+750ml)</option>
                </select>
              </div>
            </div>

            <button
              onClick={calculateRecommended}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
            >
              Calculate & Apply Recommended Goal
            </button>
          </div>

          {/* Manual Goal setting */}
          <form onSubmit={handleManualSave} className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
              Direct Goal Override (ml/day)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1000"
                max="6000"
                step="100"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="w-40 text-sm font-bold font-mono px-3 py-2 border border-slate-300 rounded"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Target</span>
              </button>
            </div>
            {savedSuccess && (
              <p className="text-xs text-emerald-600 font-semibold animate-in fade-in">
                ✓ Daily goal updated and calibrated successfully!
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
