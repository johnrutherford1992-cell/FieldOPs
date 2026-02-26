import { create } from "zustand";
import type { Project, DailyJHA, DailyLog, DailyLogScreenId } from "./types";

// ============================================================
// FieldOps Global State (Zustand)
// Lightweight client-side state for UI coordination
// ============================================================

interface AppState {
  // Active project
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;

  // Current date context
  currentDate: string; // ISO date string (YYYY-MM-DD)
  setCurrentDate: (date: string) => void;

  // JHA module state
  currentJHA: DailyJHA | null;
  setCurrentJHA: (jha: DailyJHA | null) => void;

  // Daily log module state
  currentDailyLog: Partial<DailyLog> | null;
  setCurrentDailyLog: (log: Partial<DailyLog> | null) => void;
  updateDailyLogField: <K extends keyof DailyLog>(field: K, value: DailyLog[K]) => void;

  // Daily log navigation
  currentLogScreen: DailyLogScreenId;
  setCurrentLogScreen: (screen: DailyLogScreenId) => void;

  // Settings
  claudeApiKey: string;
  setClaudeApiKey: (key: string) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

function getTodayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export const useAppStore = create<AppState>((set) => ({
  // Active project
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),

  // Current date
  currentDate: getTodayISO(),
  setCurrentDate: (date) => set({ currentDate: date }),

  // JHA
  currentJHA: null,
  setCurrentJHA: (jha) => set({ currentJHA: jha }),

  // Daily log
  currentDailyLog: null,
  setCurrentDailyLog: (log) => set({ currentDailyLog: log }),
  updateDailyLogField: (field, value) =>
    set((state) => ({
      currentDailyLog: state.currentDailyLog
        ? { ...state.currentDailyLog, [field]: value }
        : { [field]: value },
    })),

  // Daily log screen
  currentLogScreen: "weather",
  setCurrentLogScreen: (screen) => set({ currentLogScreen: screen }),

  // Settings
  claudeApiKey: "",
  setClaudeApiKey: (key) => set({ claudeApiKey: key }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
