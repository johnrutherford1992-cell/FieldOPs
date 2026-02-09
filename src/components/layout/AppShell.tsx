"use client";

import { useEffect, useState } from "react";
import BottomNav from "./BottomNav";
import { db, seedDefaultUsers, getUserById } from "@/lib/db";
import { useAppStore, loadSession } from "@/lib/store";
import { DEMO_PROJECT } from "@/data/demo-project";
import { DEMO_DAILY_LOGS } from "@/data/demo-logs";
import { DEMO_COST_CODES } from "@/data/demo-cost-codes";
import { seedAnalyticsData } from "@/data/demo-analytics-seed";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { currentUser, setSessionLoaded } = useAppStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      // Seed demo project if needed
      const existing = await db.projects.toArray();
      if (existing.length === 0) {
        await db.projects.put(DEMO_PROJECT);
      }

      // Seed default users
      await seedDefaultUsers(DEMO_PROJECT.id);

      // Seed demo daily logs if none exist
      const existingLogs = await db.dailyLogs.count();
      if (existingLogs === 0) {
        await db.dailyLogs.bulkPut(DEMO_DAILY_LOGS);
      }

      // Seed demo cost codes if none exist
      const existingCostCodes = await db.costCodes.count();
      if (existingCostCodes === 0) {
        await db.costCodes.bulkPut(DEMO_COST_CODES);
      }

      // Seed analytics demo data
      const existingEntries = await db.productivityEntries.count();
      if (existingEntries === 0) {
        try {
          await seedAnalyticsData("proj-union-square");
        } catch (err) {
          console.error("Failed to seed analytics data:", err);
        }
      }

      // Rehydrate session from localStorage
      if (!currentUser) {
        const session = loadSession();
        if (session) {
          const user = await getUserById(session.userId);
          if (user && user.isActive) {
            // Set user without triggering a new saveSession
            useAppStore.setState({ currentUser: user });

            // Restore active project
            if (session.activeProjectId) {
              const project = await db.projects.get(session.activeProjectId);
              if (project) {
                useAppStore.setState({ activeProject: project });
              }
            }
          }
        }
      }

      setSessionLoaded(true);
      setInitialized(true);
    }

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logos/blackstone-black.png"
            alt="Blackstone Construction"
            className="w-40 opacity-80"
          />
          <div className="w-8 h-8 border-2 border-onyx border-t-transparent rounded-full animate-spin" />
          <p className="text-warm-gray text-sm">Loading FieldOps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
