import React, { useState } from 'react';
import { Copy, Check, Download, Code2, Terminal, Layers } from 'lucide-react';

export const AngularCodeExport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('service');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const files: Record<string, { title: string; filename: string; language: string; code: string }> = {
    service: {
      title: 'Hydration State Service (Angular 19 Signals)',
      filename: 'src/app/services/hydration.service.ts',
      language: 'typescript',
      code: `import { Injectable, signal, computed, effect } from '@angular/core';
import { DayHydrationRecord, HydrationTask, BottlePreset, TimeSection, BeverageCategory, TaskStatus } from '../models/hydration.models';

@Injectable({
  providedIn: 'root'
})
export class HydrationService {
  // Reactive Signals for State
  readonly selectedDate = signal<string>(this.formatDateKey(new Date()));
  readonly dailyGoalMl = signal<number>(3200);
  readonly records = signal<Record<string, DayHydrationRecord>>({});
  readonly groupByMode = signal<'sections' | 'status'>('sections');

  // Computed Values
  readonly currentDayRecord = computed(() => {
    const date = this.selectedDate();
    const all = this.records();
    return all[date] || this.createDefaultDayRecord(date);
  });

  readonly currentDayTasks = computed(() => this.currentDayRecord().tasks);
  
  readonly totalLoggedToday = computed(() => {
    return this.currentDayTasks().reduce((acc, t) => acc + t.loggedMl, 0);
  });

  readonly progressPercentage = computed(() => {
    const target = this.dailyGoalMl();
    if (target <= 0) return 0;
    return Math.min(100, Math.round((this.totalLoggedToday() / target) * 100));
  });

  // Filter tasks into the 4 separate sections
  readonly morningTasks = computed(() => 
    this.currentDayTasks().filter(t => t.timeSection === 'morning')
  );
  readonly middayTasks = computed(() => 
    this.currentDayTasks().filter(t => t.timeSection === 'midday')
  );
  readonly afternoonTasks = computed(() => 
    this.currentDayTasks().filter(t => t.timeSection === 'afternoon')
  );
  readonly eveningTasks = computed(() => 
    this.currentDayTasks().filter(t => t.timeSection === 'evening')
  );

  constructor() {
    this.loadFromStorage();
    // Auto-save effect
    effect(() => {
      localStorage.setItem('hydrotrack_angular_records', JSON.stringify(this.records()));
    });
  }

  // Action methods
  addWaterToTask(taskId: string, amountMl: number): void {
    const current = this.currentDayRecord();
    const updated = current.tasks.map(t => {
      if (t.id === taskId) {
        const newLogged = t.loggedMl + amountMl;
        const newStatus: TaskStatus = newLogged >= t.targetMl ? 'completed' : 'in_progress';
        return { ...t, loggedMl: newLogged, status: newStatus };
      }
      return t;
    });

    this.updateRecordForDate(this.selectedDate(), updated);
  }

  quickLogWater(amountMl: number, section: TimeSection = 'midday', beverage: BeverageCategory = 'water'): void {
    const date = this.selectedDate();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newTask: HydrationTask = {
      id: \`\${date}-task-\${Date.now()}\`,
      code: \`HYD-\${timeStr.replace(':', '')}\`,
      title: \`Quick \${beverage} log\`,
      description: \`Logged directly via quick CTA\`,
      timeSection: section,
      status: 'completed',
      targetMl: amountMl,
      loggedMl: amountMl,
      scheduledTime: timeStr,
      beverageCategory: beverage,
      bottleName: 'Standard Tumbler'
    };

    const current = this.currentDayRecord();
    this.updateRecordForDate(date, [...current.tasks, newTask]);
  }

  setSelectedDate(dateStr: string): void {
    this.selectedDate.set(dateStr);
  }

  private updateRecordForDate(dateStr: string, tasks: HydrationTask[]): void {
    const loggedTotal = tasks.reduce((acc, t) => acc + t.loggedMl, 0);
    const targetTotal = tasks.reduce((acc, t) => acc + t.targetMl, 0);

    this.records.update(prev => ({
      ...prev,
      [dateStr]: {
        date: dateStr,
        loggedTotalMl: loggedTotal,
        targetTotalMl: targetTotal || this.dailyGoalMl(),
        tasks
      }
    }));
  }

  private formatDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return \`\${y}-\${m}-\${d}\`;
  }

  private loadFromStorage(): void {
    const saved = localStorage.getItem('hydrotrack_angular_records');
    if (saved) {
      try {
        this.records.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load storage', e);
      }
    }
  }

  private createDefaultDayRecord(date: string): DayHydrationRecord {
    return {
      date,
      targetTotalMl: this.dailyGoalMl(),
      loggedTotalMl: 0,
      tasks: [
        { id: \`\${date}-1\`, code: 'HYD-0630-AM', title: 'Wakeup Cellular Flush', description: 'Room temp mineral water', timeSection: 'morning', status: 'completed', targetMl: 500, loggedMl: 500, scheduledTime: '06:30', beverageCategory: 'water', bottleName: 'Flask' },
        { id: \`\${date}-2\`, code: 'HYD-1100-MD', title: 'Deep Work Desk Tumbler', description: 'Chilled spring water carafe', timeSection: 'midday', status: 'in_progress', targetMl: 750, loggedMl: 400, scheduledTime: '11:00', beverageCategory: 'water', bottleName: 'Tumbler' },
        { id: \`\${date}-3\`, code: 'HYD-1530-PM', title: 'Workout Hydration', description: 'BCAA & electrolyte water', timeSection: 'afternoon', status: 'scheduled', targetMl: 800, loggedMl: 0, scheduledTime: '15:30', beverageCategory: 'electrolyte', bottleName: 'Sports Bottle' },
        { id: \`\${date}-4\`, code: 'HYD-2030-EV', title: 'Evening Chamomile Infusion', description: 'Warm herbal tea', timeSection: 'evening', status: 'scheduled', targetMl: 350, loggedMl: 0, scheduledTime: '20:30', beverageCategory: 'tea', bottleName: 'Desk Mug' },
      ]
    };
  }
}`,
    },
    component: {
      title: 'Water Tracker Main Component (Angular Standalone)',
      filename: 'src/app/components/water-tracker.component.ts',
      language: 'typescript',
      code: `import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HydrationService } from '../services/hydration.service';
import { CalendarViewComponent } from './calendar-view.component';
import { TaskColumnComponent } from './task-column.component';

@Component({
  selector: 'app-water-tracker',
  standalone: true,
  imports: [CommonModule, CalendarViewComponent, TaskColumnComponent],
  template: \`
    <div class="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <!-- Dark Navy Top Bar Matching Fleet Screenshot -->
      <header class="bg-[#0b1728] text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="font-extrabold tracking-widest text-xs uppercase text-cyan-400">
            HYDRO SERVICE & INTAKE (ANGULAR 19)
          </span>
        </div>

        <nav class="flex items-center gap-4 text-xs font-semibold">
          <button (click)="view = 'overview'" [class.text-cyan-400]="view === 'overview'">Overview</button>
          <button (click)="view = 'calendar'" [class.text-cyan-400]="view === 'calendar'">Calendar</button>
        </nav>

        <div class="flex items-center gap-3">
          <button (click)="hydration.quickLogWater(250)" class="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-3 py-1.5 rounded font-bold">
            + Quick Log 250ml
          </button>
          <div class="text-xs font-mono text-cyan-300">
            {{ hydration.totalLoggedToday() }} / {{ hydration.dailyGoalMl() }} ml ({{ hydration.progressPercentage() }}%)
          </div>
        </div>
      </header>

      <!-- Main Layout -->
      <main class="max-w-7xl mx-auto p-6">
        @if (view === 'overview') {
          <div class="mb-4 flex items-center justify-between">
            <h1 class="text-xl font-bold">Daily Water Intake Overview</h1>
            <span class="text-xs font-mono text-slate-500">Date: {{ hydration.selectedDate() }}</span>
          </div>

          <!-- 4 Separate Sections for Daily Tasks -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <app-task-column title="Morning Wake & Prime" [tasks]="hydration.morningTasks()" hours="06:00 - 10:00" />
            <app-task-column title="Midday Focus & Fuel" [tasks]="hydration.middayTasks()" hours="10:00 - 14:00" />
            <app-task-column title="Afternoon Peak & Active" [tasks]="hydration.afternoonTasks()" hours="14:00 - 18:00" />
            <app-task-column title="Evening Restore & Rest" [tasks]="hydration.eveningTasks()" hours="18:00 - 22:00" />
          </div>
        } @else {
          <!-- Full Calendar View Tracking Everything -->
          <app-calendar-view />
        }
      </main>
    </div>
  \`
})
export class WaterTrackerComponent {
  readonly hydration = inject(HydrationService);
  view: 'overview' | 'calendar' = 'overview';
}`,
    },
    calendar: {
      title: 'Calendar Tracking Component (Angular Standalone)',
      filename: 'src/app/components/calendar-view.component.ts',
      language: 'typescript',
      code: `import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HydrationService } from '../services/hydration.service';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h2 class="text-lg font-bold text-slate-900">Hydration History & Monthly Tracker</h2>
        <div class="text-xs font-semibold text-slate-500">
          Selected Date: <span class="text-blue-600 font-mono font-bold">{{ hydration.selectedDate() }}</span>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase py-2">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div class="grid grid-cols-7 gap-2">
        @for (day of monthDays; track day.date) {
          <button
            (click)="hydration.setSelectedDate(day.date)"
            [class.border-blue-600]="hydration.selectedDate() === day.date"
            [class.bg-blue-50]="hydration.selectedDate() === day.date"
            class="min-h-[70px] p-2 rounded border border-slate-200 text-left flex flex-col justify-between hover:border-slate-400 transition-colors"
          >
            <div class="flex justify-between items-center text-xs font-bold font-mono">
              <span>{{ day.dayNum }}</span>
              <span class="text-[10px]" [class.text-emerald-600]="day.isTargetMet">{{ day.percent }}%</span>
            </div>
            <div class="text-[11px] font-mono text-slate-700">
              {{ day.loggedMl }} ml
            </div>
            <!-- 4 section indicator dots -->
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            </div>
          </button>
        }
      </div>
    </div>
  \`
})
export class CalendarViewComponent {
  readonly hydration = inject(HydrationService);
  
  // Dummy 30 day matrix for template
  monthDays = Array.from({ length: 30 }, (_, i) => {
    const d = i + 1;
    const date = \`2026-11-\${String(d).padStart(2, '0')}\`;
    const loggedMl = Math.round(1800 + Math.sin(i) * 1200);
    const percent = Math.min(100, Math.round((loggedMl / 3200) * 100));
    return {
      dayNum: d,
      date,
      loggedMl,
      percent,
      isTargetMet: percent >= 90
    };
  });
}`,
    },
    taskColumn: {
      title: 'Task Column Component (4 Sections)',
      filename: 'src/app/components/task-column.component.ts',
      language: 'typescript',
      code: `import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HydrationTask } from '../models/hydration.models';
import { HydrationService } from '../services/hydration.service';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="flex flex-col">
      <!-- Section Header matching Fleet Screenshot -->
      <div class="bg-[#e9edf2] text-slate-800 px-3 py-2 rounded-t-md border border-slate-300 flex items-center justify-between">
        <span class="text-xs font-bold">{{ title }}</span>
        <span class="bg-white text-slate-700 text-[11px] font-bold px-1.5 py-0.5 rounded-full font-mono">
          {{ tasks.length }}
        </span>
      </div>

      <!-- Time Window Subheader -->
      <div class="bg-slate-100 px-3 py-1 text-[11px] font-mono text-slate-500 border-x border-slate-200">
        {{ hours }}
      </div>

      <!-- Card Container -->
      <div class="bg-[#f4f6f9] p-2.5 rounded-b-md border border-t-0 border-slate-200 flex-1 space-y-2.5 min-h-[320px]">
        @for (task of tasks; track task.id) {
          <div class="bg-white rounded p-3 border border-slate-200 shadow-2xs">
            <div class="flex justify-between items-start mb-1">
              <span class="text-[11px] font-mono font-bold text-slate-900">{{ task.code }}</span>
              <span class="text-[10px] font-mono" [class.text-emerald-600]="task.status === 'completed'">
                {{ task.status }}
              </span>
            </div>

            <h4 class="text-xs font-semibold text-slate-800 line-clamp-1">{{ task.title }}</h4>
            <p class="text-[11px] text-slate-500">{{ task.description }}</p>

            <div class="flex justify-between items-center text-[11px] font-mono text-slate-600 mt-2 pt-2 border-t border-slate-100">
              <span>{{ task.loggedMl }} / {{ task.targetMl }} ml</span>
              <div class="flex gap-1">
                <button (click)="hydration.addWaterToTask(task.id, 150)" class="px-1.5 py-0.5 bg-slate-100 hover:bg-cyan-100 rounded text-[10px]">
                  +150ml
                </button>
                <button (click)="hydration.addWaterToTask(task.id, 250)" class="px-1.5 py-0.5 bg-slate-100 hover:bg-cyan-100 rounded text-[10px]">
                  +250ml
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="text-center py-8 text-xs text-slate-400">
            No scheduled tasks in this section
          </div>
        }
      </div>
    </div>
  \`
})
export class TaskColumnComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) tasks: HydrationTask[] = [];
  @Input({ required: true }) hours!: string;

  readonly hydration = inject(HydrationService);
}`,
    },
    models: {
      title: 'Hydration Models Interface',
      filename: 'src/app/models/hydration.models.ts',
      language: 'typescript',
      code: `export type TimeSection = 'morning' | 'midday' | 'afternoon' | 'evening';
export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'delayed';
export type BeverageCategory = 'water' | 'electrolyte' | 'tea' | 'infusion' | 'sparkling' | 'smoothie';

export interface HydrationTask {
  id: string;
  code: string;
  title: string;
  description: string;
  timeSection: TimeSection;
  status: TaskStatus;
  targetMl: number;
  loggedMl: number;
  scheduledTime: string;
  beverageCategory: BeverageCategory;
  bottleName: string;
  temperature?: 'chilled' | 'room' | 'warm';
}

export interface DayHydrationRecord {
  date: string;
  targetTotalMl: number;
  loggedTotalMl: number;
  tasks: HydrationTask[];
}

export interface BottlePreset {
  id: string;
  name: string;
  volumeMl: number;
  iconType: string;
  description: string;
}`,
    },
  };

  const handleDownloadAll = () => {
    const combinedContent = Object.entries(files)
      .map(([key, f]) => `// ==========================================\n// FILE: ${f.filename}\n// ==========================================\n\n${f.code}\n\n`)
      .join('\n');

    const blob = new Blob([combinedContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydrotrack-angular-standalone-architecture.ts';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">
              ANGULAR 19
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Angular Standalone Code Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete standalone components, Angular Signals, RxJS reactive patterns, and Tailwind styles
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All Angular Files</span>
          </button>
        </div>
      </div>

      {/* Terminal Setup Instructions */}
      <div className="bg-[#0b1728] text-slate-200 rounded-lg p-4 font-mono text-xs border border-slate-800">
        <div className="flex items-center gap-2 text-slate-400 mb-2">
          <Terminal className="w-3.5 h-3.5 text-red-400" />
          <span className="font-bold text-white">How to run in Angular CLI:</span>
        </div>
        <pre className="text-cyan-300 leading-relaxed overflow-x-auto">
{`# 1. Generate new Angular 19 standalone app
npx @angular/cli new hydro-track --standalone --routing=false --style=css

# 2. Add Tailwind CSS & icons
npm install tailwindcss lucide-angular

# 3. Paste the files below into src/app/`}
        </pre>
      </div>

      {/* File Selector Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {Object.entries(files).map(([key, f]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === key
                ? 'border-red-600 text-red-600 bg-red-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {f.filename.split('/').pop()}
          </button>
        ))}
      </div>

      {/* Code Viewer */}
      {files[activeTab] && (
        <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-md">
          <div className="bg-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-red-400" />
              <span className="text-xs font-mono text-slate-300">{files[activeTab].filename}</span>
            </div>

            <button
              onClick={() => copyToClipboard(files[activeTab].code, activeTab)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
            >
              {copied === activeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 overflow-x-auto max-h-[500px]">
            <pre className="text-xs font-mono text-slate-200 leading-relaxed">
              <code>{files[activeTab].code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
