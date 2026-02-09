import { create } from "zustand";
import type { Project, DailyJHA, DailyLog, DailyLogScreenId, AppUser, UserRole } from "./types";

// ============================================================
// FieldOps Global State (Zustand)
// Lightweight client-side state for UI coordination
// ============================================================

const SESSION_KEY = "fieldops-session";

interface PersistedSession {
  userId: string;
  userName: string;
  userRole: UserRole;
  activeProjectId: string | null;
}

function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

function saveSession(session: PersistedSession | null): void {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

interface AppState {
  // Auth / session
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser) => void;
  logout: () => void;
  sessionLoaded: boolean;
  setSessionLoaded: (loaded: boolean) => void;

  // Active project
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  clearActiveProject: () => void;

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
  // Auth / session
  currentUser: null,
  sessionLoaded: false,
  setSessionLoaded: (loaded) => set({ sessionLoaded: loaded }),
  setCurrentUser: (user) => {
    saveSession({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      activeProjectId: null,
    });
    set({ currentUser: user });
  },
  logout: () => {
    saveSession(null);
    set({ currentUser: null, activeProject: null });
  },

  // Active project
  activeProject: null,
  setActiveProject: (project) => {
    // Also persist the project selection in the session
    const existing = loadSession();
    if (existing) {
      saveSession({ ...existing, activeProjectId: project.id });
    }
    set({ activeProject: project });
  },
  clearActiveProject: () => {
    const existing = loadSession();
    if (existing) {
      saveSession({ ...existing, activeProjectId: null });
    }
    set({ activeProject: null });
  },

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

// Utility to get persisted session without hydrating the store
export { loadSession, saveSession };
export type { PersistedSession };
