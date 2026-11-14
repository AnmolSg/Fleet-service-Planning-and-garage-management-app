export type TimeSection = 'morning' | 'midday' | 'afternoon' | 'evening';
export type TaskStatus = 'scheduled' | 'in_progress' | 'completed' | 'delayed';
export type BeverageCategory = 'water' | 'electrolyte' | 'tea' | 'infusion' | 'sparkling' | 'smoothie';

export interface HydrationTask {
  id: string;
  code: string; // e.g. "HYD-0730-AM"
  title: string;
  description: string;
  timeSection: TimeSection;
  status: TaskStatus;
  targetMl: number;
  loggedMl: number;
  scheduledTime: string; // "07:30"
  beverageCategory: BeverageCategory;
  bottleName: string;
  temperature?: 'chilled' | 'room' | 'warm';
  notes?: string;
  updatedAt?: string;
  isPriority?: boolean;
}

export interface DayHydrationRecord {
  date: string; // "YYYY-MM-DD"
  targetTotalMl: number;
  loggedTotalMl: number;
  tasks: HydrationTask[];
  notes?: string;
}

export interface BottlePreset {
  id: string;
  name: string;
  volumeMl: number;
  iconType: 'glass' | 'mug' | 'tumbler' | 'sports_bottle' | 'flask' | 'jug';
  description: string;
}

export interface HydrationAlert {
  id: string;
  type: 'proposal' | 'confirmed' | 'performed' | 'reminder';
  title: string;
  message: string;
  timeAgo: string;
  timestamp: string;
  dismissed: boolean;
  category: 'hydration' | 'streak' | 'reminder' | 'health';
}

export type ViewMode = 'overview' | 'calendar' | 'tasks' | 'bottles' | 'analytics' | 'angular_code' | 'settings';

export type GroupByMode = 'sections' | 'status';
