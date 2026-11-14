import { useState, useEffect } from 'react';
import {
  BeverageCategory,
  BottlePreset,
  DayHydrationRecord,
  GroupByMode,
  HydrationAlert,
  HydrationTask,
  TaskStatus,
  TimeSection,
  ViewMode,
} from '../types/hydration';
import {
  DEFAULT_BOTTLES,
  INITIAL_ALERTS,
  createDefaultTasksForDay,
  formatDateKey,
  generateInitialCalendarRecords,
} from '../data/initialData';

const STORAGE_KEY_RECORDS = 'hydrotrack_records_v1';
const STORAGE_KEY_BOTTLES = 'hydrotrack_bottles_v1';
const STORAGE_KEY_ALERTS = 'hydrotrack_alerts_v1';
const STORAGE_KEY_GOAL = 'hydrotrack_goal_v1';

export function useHydrationStore() {
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('sections');
  const [dailyGoalMl, setDailyGoalMl] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GOAL);
    return saved ? parseInt(saved, 10) : 3200;
  });

  const [records, setRecords] = useState<Record<string, DayHydrationRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECORDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved records', e);
    }
    return generateInitialCalendarRecords();
  });

  const [bottles, setBottles] = useState<BottlePreset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BOTTLES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved bottles', e);
    }
    return DEFAULT_BOTTLES;
  });

  const [alerts, setAlerts] = useState<HydrationAlert[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved alerts', e);
    }
    return INITIAL_ALERTS;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.error('Error saving records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BOTTLES, JSON.stringify(bottles));
    } catch (e) {
      console.error('Error saving bottles', e);
    }
  }, [bottles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.error('Error saving alerts', e);
    }
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_GOAL, dailyGoalMl.toString());
  }, [dailyGoalMl]);

  // Ensure current selectedDate has a record
  const currentDayRecord: DayHydrationRecord = records[selectedDate] || {
    date: selectedDate,
    targetTotalMl: dailyGoalMl,
    loggedTotalMl: 0,
    tasks: createDefaultTasksForDay(selectedDate),
  };

  // Helper to update records immutably
  const updateCurrentDayTasks = (updater: (tasks: HydrationTask[]) => HydrationTask[]) => {
    setRecords((prev) => {
      const existing = prev[selectedDate] || {
        date: selectedDate,
        targetTotalMl: dailyGoalMl,
        loggedTotalMl: 0,
        tasks: createDefaultTasksForDay(selectedDate),
      };

      const updatedTasks = updater([...existing.tasks]);
      const loggedTotal = updatedTasks.reduce((acc, t) => acc + t.loggedMl, 0);
      const targetTotal = updatedTasks.reduce((acc, t) => acc + t.targetMl, 0);

      return {
        ...prev,
        [selectedDate]: {
          ...existing,
          tasks: updatedTasks,
          loggedTotalMl: loggedTotal,
          targetTotalMl: targetTotal > 0 ? targetTotal : dailyGoalMl,
        },
      };
    });
  };

  // Quick increment for a task
  const addWaterToTask = (taskId: string, amountMl: number) => {
    updateCurrentDayTasks((tasks) =>
      tasks.map((task) => {
        if (task.id === taskId) {
          const newLogged = Math.max(0, task.loggedMl + amountMl);
          let newStatus = task.status;
          if (newLogged >= task.targetMl) {
            newStatus = 'completed';
          } else if (newLogged > 0) {
            newStatus = 'in_progress';
          }
          return {
            ...task,
            loggedMl: newLogged,
            status: newStatus,
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return task;
      })
    );
  };

  // Complete a task fully
  const completeTask = (taskId: string) => {
    updateCurrentDayTasks((tasks) =>
      tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            loggedMl: Math.max(task.loggedMl, task.targetMl),
            status: 'completed',
            updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return task;
      })
    );
  };

  // Set task status
  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    updateCurrentDayTasks((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
    );
  };

  // Create new task in a specific section
  const addNewTask = (taskData: Omit<HydrationTask, 'id'>) => {
    const id = `${selectedDate}-task-${Date.now()}`;
    updateCurrentDayTasks((tasks) => [
      ...tasks,
      {
        ...taskData,
        id,
      },
    ]);
  };

  // Delete a task
  const deleteTask = (taskId: string) => {
    updateCurrentDayTasks((tasks) => tasks.filter((t) => t.id !== taskId));
  };

  // Quick direct water log (e.g. from top action button "+ Log Water Intake")
  const quickLogWater = (
    amountMl: number,
    section: TimeSection = 'midday',
    beverage: BeverageCategory = 'water',
    bottleName: string = 'Standard Tumbler'
  ) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const id = `${selectedDate}-quick-${Date.now()}`;
    const code = `LOG-${timeStr.replace(':', '')}`;

    const newTask: HydrationTask = {
      id,
      code,
      title: `${beverage.charAt(0).toUpperCase() + beverage.slice(1)} Intake (${amountMl}ml)`,
      description: `Logged via quick action from ${bottleName}`,
      timeSection: section,
      status: 'completed',
      targetMl: amountMl,
      loggedMl: amountMl,
      scheduledTime: timeStr,
      beverageCategory: beverage,
      bottleName,
      updatedAt: timeStr,
    };

    updateCurrentDayTasks((tasks) => [...tasks, newTask]);
  };

  // Dismiss single alert
  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
  };

  // Dismiss all alerts
  const dismissAllAlerts = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, dismissed: true })));
  };

  // Reset alert list to defaults
  const resetAlerts = () => {
    setAlerts(INITIAL_ALERTS);
  };

  // Reset day to default schedule
  const resetDaySchedule = (dateStr: string) => {
    setRecords((prev) => {
      const defaults = createDefaultTasksForDay(dateStr);
      return {
        ...prev,
        [dateStr]: {
          date: dateStr,
          targetTotalMl: dailyGoalMl,
          loggedTotalMl: defaults.reduce((s, t) => s + t.loggedMl, 0),
          tasks: defaults,
        },
      };
    });
  };

  // Streak calculation: count consecutive days backwards from today where logged >= 90% of target
  const getStreakCount = (): number => {
    let streak = 0;
    const today = new Date();
    // Check backwards up to 60 days
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = formatDateKey(d);
      const rec = records[key];
      if (!rec) {
        if (i === 0) continue; // today might be in progress
        break;
      }
      const ratio = rec.targetTotalMl > 0 ? rec.loggedTotalMl / rec.targetTotalMl : 0;
      if (ratio >= 0.85) {
        streak++;
      } else {
        if (i === 0) {
          // If today isn't met yet, don't break streak if yesterday met it
          continue;
        }
        break;
      }
    }
    return Math.max(streak, 1);
  };

  return {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    groupByMode,
    setGroupByMode,
    dailyGoalMl,
    setDailyGoalMl,
    records,
    currentDayRecord,
    bottles,
    setBottles,
    alerts,
    addWaterToTask,
    completeTask,
    setTaskStatus,
    addNewTask,
    deleteTask,
    quickLogWater,
    dismissAlert,
    dismissAllAlerts,
    resetAlerts,
    resetDaySchedule,
    getStreakCount,
  };
}

export type HydrationStore = ReturnType<typeof useHydrationStore>;
