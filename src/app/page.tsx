"use client";

import { useAppStore } from "@/lib/store";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import BigButton from "@/components/ui/BigButton";
import {
  ShieldCheck,
  ClipboardList,
  FileBarChart,
  Settings,
  Building2,
  Calendar,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
  BookOpen,
  Link as LinkIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "@/lib/db";
// Types used by db queries below

export default function HomePage() {
  const { activeProject, currentDate } = useAppStore();
  const [jhaExists, setJhaExists] = useState(false);
  const [logExists, setLogExists] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<{
    totalWorkers: number;
    workItems: number;
    issuesTracked: number;
  } | null>(null);

  const today = new Date(currentDate + "T12:00:00");
  const formatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Load today's JHA and Daily Log status
  useEffect(() => {
    if (!activeProject) return;

    const loadTodayStatus = async () => {
      try {
        const jha = await db.dailyJHAs
          .where({ projectId: activeProject.id, date: currentDate })
          .first();
        setJhaExists(!!jha);

        const log = await db.dailyLogs
          .where({ projectId: activeProject.id, date: currentDate })
          .first();
        setLogExists(!!log);
      } catch (error) {
        console.error("Error loading today status:", error);
      }
    };

    loadTodayStatus();
  }, [activeProject, currentDate]);

  // Load this week's stats
  useEffect(() => {
    if (!activeProject) return;

    const loadWeeklyStats = async () => {
      try {
        // Calculate week start (Monday) and week end (Sunday)
        const currentDateObj = new Date(currentDate + "T12:00:00");
        const dayOfWeek = currentDateObj.getDay();
        const diff = currentDateObj.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const weekStart = new Date(currentDateObj.setDate(diff));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekStartStr = weekStart.toISOString().split("T")[0];
        const weekEndStr = weekEnd.toISOString().split("T")[0];

        const logs = await db.dailyLogs
          .where("projectId")
          .equals(activeProject.id)
          .filter((log) => log.date >= weekStartStr && log.date <= weekEndStr)
          .toArray();

        if (logs.length === 0) {
          setWeeklyStats(null);
          return;
        }

        let totalWorkers = 0;
        let workItems = 0;
        let issuesTracked = 0;

        logs.forEach((log) => {
          // Sum manpower
          log.manpower.forEach((entry) => {
            totalWorkers += entry.journeymanCount + entry.apprenticeCount + entry.foremanCount;
          });
          // Count work performed entries
          workItems += log.workPerformed.length;
          // Count conflicts
          issuesTracked += log.conflicts.length;
        });

        setWeeklyStats({ totalWorkers, workItems, issuesTracked });
      } catch (error) {
        console.error("Error loading weekly stats:", error);
      }
    };

    loadWeeklyStats();
  }, [activeProject, currentDate]);

  return (
    <AppShell>
      <div className="screen">
        <Header showLogo />

        {/* Welcome section */}
        <div className="px-5 pt-5 pb-3">
          <p className="text-warm-gray text-sm">{formatted}</p>
          <h1 className="font-heading text-[28px] font-medium mt-1 leading-tight">
            Good morning
          </h1>
        </div>

        {/* Active project card */}
        {activeProject && (
          <div className="px-5 pb-4">
            <div className="bg-alabaster border border-gray-100 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-onyx rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-lg font-medium truncate">
                    {activeProject.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-warm-gray text-sm mt-0.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{activeProject.address}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-warm-gray">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {activeProject.subcontractors.length} subs
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {activeProject.taktZones.length} zones
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Today&apos;s Status Row */}
        {activeProject && (
          <div className="px-5 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Morning JHA Card */}
              <div className="bg-alabaster border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {jhaExists ? (
                    <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-warm-gray rounded-full flex items-center justify-center opacity-30">
                      <Clock className="w-5 h-5 text-onyx" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-warm-gray">Morning JHA</p>
                  <p className="text-sm font-heading font-medium text-onyx">
                    {jhaExists ? "Complete" : "Not Started"}
                  </p>
                </div>
              </div>

              {/* Daily Log Card */}
              <div className="bg-alabaster border border-gray-100 rounded-xl p-4 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {logExists ? (
                    <div className="w-8 h-8 bg-accent-green rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-warm-gray rounded-full flex items-center justify-center opacity-30">
                      <Clock className="w-5 h-5 text-onyx" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-warm-gray">Daily Log</p>
                  <p className="text-sm font-heading font-medium text-onyx">
                    {logExists ? "Complete" : "Not Started"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* This Week Quick Stats */}
        {weeklyStats && (
          <div className="px-5 pb-4">
            <div className="flex gap-2 justify-center">
              <div className="bg-alabaster border border-gray-100 rounded-lg px-4 py-2.5 text-center">
                <p className="text-xs text-warm-gray font-medium">Workers</p>
                <p className="text-lg font-heading font-bold text-onyx">{weeklyStats.totalWorkers}</p>
              </div>
              <div className="bg-alabaster border border-gray-100 rounded-lg px-4 py-2.5 text-center">
                <p className="text-xs text-warm-gray font-medium">Work Items</p>
                <p className="text-lg font-heading font-bold text-onyx">{weeklyStats.workItems}</p>
              </div>
              <div className="bg-alabaster border border-gray-100 rounded-lg px-4 py-2.5 text-center">
                <p className="text-xs text-warm-gray font-medium">Issues</p>
                <p className="text-lg font-heading font-bold text-onyx">{weeklyStats.issuesTracked}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="px-5 pb-3">
          <h3 className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase">
            Today&apos;s Actions
          </h3>
        </div>

        <div className="px-5 space-y-3">
          <Link href="/jha" className="block no-underline">
            <BigButton
              label="Morning JHA"
              sublabel="Select tasks & generate safety analysis"
              icon={<ShieldCheck className="w-6 h-6" />}
              variant="dark"
            />
          </Link>

          <Link href="/daily-log" className="block no-underline">
            <BigButton
              label="Daily Log"
              sublabel="Record manpower, work, equipment & more"
              icon={<ClipboardList className="w-6 h-6" />}
            />
          </Link>

          <Link href="/reports" className="block no-underline">
            <BigButton
              label="Reports"
              sublabel="Weekly reports, change orders & legal"
              icon={<FileBarChart className="w-6 h-6" />}
            />
          </Link>

          <Link href="/productivity" className="block no-underline">
            <BigButton
              icon={<BarChart3 className="w-6 h-6" />}
              label="Productivity"
              sublabel="Unit rate tracking"
            />
          </Link>

          <Link href="/analytics" className="block no-underline">
            <BigButton
              icon={<TrendingUp className="w-6 h-6" />}
              label="Analytics"
              sublabel="Trends, variance & health score"
            />
          </Link>

          <Link href="/bid-feedback" className="block no-underline">
            <BigButton
              icon={<BookOpen className="w-6 h-6" />}
              label="Bid Feedback"
              sublabel="Unit price book & bid vs. actual"
            />
          </Link>

          <Link href="/notice-log" className="block no-underline">
            <BigButton
              icon={<FileText className="w-6 h-6" />}
              label="Notice Log"
              sublabel="Contractual notices & responses"
            />
          </Link>

          <Link href="/causation" className="block no-underline">
            <BigButton
              icon={<LinkIcon className="w-6 h-6" />}
              label="Causation Chains"
              sublabel="Legal dispute timeline & evidence"
            />
          </Link>

          <Link href="/project-setup" className="block no-underline">
            <BigButton
              label="Project Setup"
              sublabel="Zones, subs, equipment & contracts"
              icon={<Settings className="w-6 h-6" />}
            />
          </Link>
        </div>

        {/* Footer branding */}
        <div className="flex justify-center py-8">
          <img
            src="/logos/blackstone-black.png"
            alt="Blackstone Construction"
            className="w-28 opacity-20"
          />
        </div>
      </div>
    </AppShell>
  );
}
