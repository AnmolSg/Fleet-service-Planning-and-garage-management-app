import { BottlePreset, DayHydrationRecord, HydrationAlert, HydrationTask } from '../types/hydration';

export const DEFAULT_BOTTLES: BottlePreset[] = [
  { id: 'b1', name: 'Standard Tumbler', volumeMl: 250, iconType: 'glass', description: 'Quick 1-cup hydration sip' },
  { id: 'b2', name: 'Desk Mug / Tea Infuser', volumeMl: 350, iconType: 'mug', description: 'Warm herbal & mineral cup' },
  { id: 'b3', name: 'Active Sports Bottle', volumeMl: 500, iconType: 'sports_bottle', description: 'Gym & workout hydration' },
  { id: 'b4', name: 'Hydro Insulated Flask', volumeMl: 750, iconType: 'flask', description: 'Thermal travel flask' },
  { id: 'b5', name: 'Chamber Gallon Growler', volumeMl: 1000, iconType: 'jug', description: 'High-volume morning carafe' },
];

export const INITIAL_ALERTS: HydrationAlert[] = [
  {
    id: 'alt-1',
    type: 'proposal',
    title: 'Hydration Catch-Up Proposal',
    message: 'Afternoon metabolic dip detected: schedule 450ml with light citrus electrolytes before 15:30.',
    timeAgo: '15 mins ago',
    timestamp: new Date().toISOString(),
    dismissed: false,
    category: 'hydration',
  },
  {
    id: 'alt-2',
    type: 'confirmed',
    title: 'Goal Block Locked',
    message: 'Midday focus session successfully logged 1,000ml of chilled spring water. Target on schedule.',
    timeAgo: '2 hours ago',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    dismissed: false,
    category: 'reminder',
  },
  {
    id: 'alt-3',
    type: 'performed',
    title: 'Intake Milestone Performed',
    message: 'Morning wake & prime target achieved (850ml / 750ml target). Cellular hydration active.',
    timeAgo: '4 hours ago',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    dismissed: false,
    category: 'health',
  },
  {
    id: 'alt-4',
    type: 'proposal',
    title: 'Evening Mineral Balance Suggestion',
    message: 'Prepare 350ml magnesium-infused warm chamomile tea 45 mins before bedtime.',
    timeAgo: 'Yesterday',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    dismissed: false,
    category: 'hydration',
  },
  {
    id: 'alt-5',
    type: 'confirmed',
    title: '7-Day Streak Maintained',
    message: 'Consistency index at 98.4%. Water intake has satisfied the daily 3,000ml target for 7 consecutive days.',
    timeAgo: '2 days ago',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    dismissed: false,
    category: 'streak',
  },
];

// Helper to format YYYY-MM-DD
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Generate realistic tasks for any given day
export function createDefaultTasksForDay(dateStr: string): HydrationTask[] {
  return [
    // 1. Morning Wake & Prime (06:00 - 10:00)
    {
      id: `${dateStr}-task-1`,
      code: 'HYD-0630-AM',
      title: 'Wakeup Cellular Flush',
      description: 'Room temp mineral water with pink Himalayan salt pinch',
      timeSection: 'morning',
      status: 'completed',
      targetMl: 500,
      loggedMl: 500,
      scheduledTime: '06:30',
      beverageCategory: 'water',
      bottleName: 'Hydro Insulated Flask',
      temperature: 'room',
      notes: 'Consumed immediately upon waking.',
      isPriority: true,
    },
    {
      id: `${dateStr}-task-2`,
      code: 'HYD-0830-AM',
      title: 'Post-Breakfast Green Tea Sip',
      description: 'Organic Sencha green tea for antioxidant priming',
      timeSection: 'morning',
      status: 'completed',
      targetMl: 350,
      loggedMl: 350,
      scheduledTime: '08:30',
      beverageCategory: 'tea',
      bottleName: 'Desk Mug / Tea Infuser',
      temperature: 'warm',
      notes: 'Paired with breakfast oats.',
    },
    {
      id: `${dateStr}-task-3`,
      code: 'HYD-0945-AM',
      title: 'Pre-Meeting Electrolyte Boost',
      description: 'Light lemon electrolyte infusion prior to morning standup',
      timeSection: 'morning',
      status: 'completed',
      targetMl: 250,
      loggedMl: 250,
      scheduledTime: '09:45',
      beverageCategory: 'electrolyte',
      bottleName: 'Standard Tumbler',
      temperature: 'chilled',
    },

    // 2. Midday Focus & Fuel (10:00 - 14:00)
    {
      id: `${dateStr}-task-4`,
      code: 'HYD-1100-MD',
      title: 'Deep Work Desk Tumbler',
      description: 'Chilled reverse-osmosis spring water carafe',
      timeSection: 'midday',
      status: 'completed',
      targetMl: 500,
      loggedMl: 500,
      scheduledTime: '11:00',
      beverageCategory: 'water',
      bottleName: 'Standard Tumbler',
      temperature: 'chilled',
      notes: 'Sipped continuously through deep coding sprints.',
    },
    {
      id: `${dateStr}-task-5`,
      code: 'HYD-1245-MD',
      title: 'Lunchtime Digest Hydration',
      description: 'Sparkling mineral water with lime squeeze',
      timeSection: 'midday',
      status: 'completed',
      targetMl: 400,
      loggedMl: 400,
      scheduledTime: '12:45',
      beverageCategory: 'sparkling',
      bottleName: 'Hydro Insulated Flask',
      temperature: 'chilled',
    },
    {
      id: `${dateStr}-task-6`,
      code: 'HYD-1330-MD',
      title: 'Post-Lunch Hydration Top-Up',
      description: 'Clean mountain spring water to prevent lethargy',
      timeSection: 'midday',
      status: 'in_progress',
      targetMl: 350,
      loggedMl: 200,
      scheduledTime: '13:30',
      beverageCategory: 'water',
      bottleName: 'Desk Mug / Tea Infuser',
      temperature: 'room',
      isPriority: true,
    },

    // 3. Afternoon Peak & Workout (14:00 - 18:00)
    {
      id: `${dateStr}-task-7`,
      code: 'HYD-1500-PM',
      title: 'Pre-Workout Hyper-Hydration',
      description: 'Coconut water & magnesium water blend',
      timeSection: 'afternoon',
      status: 'in_progress',
      targetMl: 500,
      loggedMl: 250,
      scheduledTime: '15:00',
      beverageCategory: 'electrolyte',
      bottleName: 'Active Sports Bottle',
      temperature: 'chilled',
      notes: '30 minutes before gym training session.',
      isPriority: true,
    },
    {
      id: `${dateStr}-task-8`,
      code: 'HYD-1630-PM',
      title: 'Intra-Training Water Flask',
      description: 'Cold filtered water refill during workout',
      timeSection: 'afternoon',
      status: 'scheduled',
      targetMl: 500,
      loggedMl: 0,
      scheduledTime: '16:30',
      beverageCategory: 'water',
      bottleName: 'Chamber Gallon Growler',
      temperature: 'chilled',
    },
    {
      id: `${dateStr}-task-9`,
      code: 'HYD-1745-PM',
      title: 'Post-Training Recovery Flush',
      description: 'Rehydration salt formulation with 300ml fresh water',
      timeSection: 'afternoon',
      status: 'scheduled',
      targetMl: 300,
      loggedMl: 0,
      scheduledTime: '17:45',
      beverageCategory: 'infusion',
      bottleName: 'Standard Tumbler',
      temperature: 'room',
    },

    // 4. Evening Restore & Rest (18:00 - 22:00)
    {
      id: `${dateStr}-task-10`,
      code: 'HYD-1900-EV',
      title: 'Dinner Table Sparkling Sip',
      description: 'Lightly carbonated water with rosemary & cucumber',
      timeSection: 'evening',
      status: 'scheduled',
      targetMl: 350,
      loggedMl: 0,
      scheduledTime: '19:00',
      beverageCategory: 'sparkling',
      bottleName: 'Hydro Insulated Flask',
      temperature: 'chilled',
    },
    {
      id: `${dateStr}-task-11`,
      code: 'HYD-2030-EV',
      title: 'Evening Chamomile Infusion',
      description: 'Warm caffeine-free herbal tea with trace lavender',
      timeSection: 'evening',
      status: 'scheduled',
      targetMl: 300,
      loggedMl: 0,
      scheduledTime: '20:30',
      beverageCategory: 'tea',
      bottleName: 'Desk Mug / Tea Infuser',
      temperature: 'warm',
    },
    {
      id: `${dateStr}-task-12`,
      code: 'HYD-2145-EV',
      title: 'Nightstand Bedtime Micro-Sip',
      description: 'Small glass of room temperature water (not overfilling bladder)',
      timeSection: 'evening',
      status: 'scheduled',
      targetMl: 150,
      loggedMl: 0,
      scheduledTime: '21:45',
      beverageCategory: 'water',
      bottleName: 'Standard Tumbler',
      temperature: 'room',
    },
  ];
}

// Generate pre-populated history for the current month so the calendar tracks historical data
export function generateInitialCalendarRecords(): Record<string, DayHydrationRecord> {
  const records: Record<string, DayHydrationRecord> = {};
  const today = new Date();

  // Create records for past 30 days and next 7 days
  for (let i = -25; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const key = formatDateKey(d);

    const tasks = createDefaultTasksForDay(key);

    if (i < 0) {
      // Past days: realistic variations of completion
      const completionRatio = i % 7 === 0 ? 0.72 : i % 5 === 0 ? 0.88 : i % 3 === 0 ? 1.05 : 0.96;
      tasks.forEach((t) => {
        if (completionRatio >= 0.9) {
          t.status = 'completed';
          t.loggedMl = Math.round(t.targetMl * completionRatio);
        } else {
          t.status = Math.random() > 0.3 ? 'completed' : 'delayed';
          t.loggedMl = t.status === 'completed' ? t.targetMl : Math.round(t.targetMl * 0.4);
        }
      });
    } else if (i === 0) {
      // Today: partial progress as defined in createDefaultTasksForDay
    } else {
      // Future days: all scheduled
      tasks.forEach((t) => {
        t.status = 'scheduled';
        t.loggedMl = 0;
      });
    }

    const targetTotal = tasks.reduce((sum, t) => sum + t.targetMl, 0);
    const loggedTotal = tasks.reduce((sum, t) => sum + t.loggedMl, 0);

    records[key] = {
      date: key,
      targetTotalMl: targetTotal,
      loggedTotalMl: loggedTotal,
      tasks,
    };
  }

  return records;
}
