"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import BigButton from "@/components/ui/BigButton";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db";
import type { DailyLog } from "@/lib/types";
import {
  FileBarChart,
  FileText,
  Users,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Truck,
  HardHat,
} from "lucide-react";
import Link from "next/link";

export default function ReportsPage() {
  const { activeProject, currentDate } = useAppStore();
  const [weekLogs, setWeekLogs] = useState<DailyLog[]>([]);

  // Load this week's logs for utilization summaries
  useEffect(() => {
    if (!activeProject) return;

    async function loadLogs() {
      if (!activeProject) return;
      const today = new Date(currentDate);
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const weekStart = monday.toISOString().split("T")[0];

      const logs = await db.dailyLogs
        .where("projectId")
        .equals(activeProject.id)
        .filter((log) => log.date >= weekStart && log.date <= currentDate)
        .toArray();
      setWeekLogs(logs);
    }

    loadLogs();
  }, [activeProject, currentDate]);

  // Compute utilization stats
  const manpowerByDay = weekLogs.map((log) => ({
    date: log.date,
    total: log.manpower.reduce(
      (sum, m) => sum + m.journeymanCount + m.apprenticeCount + m.foremanCount,
      0
    ),
    trades: log.manpower.length,
  }));

  const equipmentByDay = weekLogs.map((log) => ({
    date: log.date,
    count: log.equipment.length,
    rented: log.equipment.filter((e) => e.ownership === "rented").length,
    owned: log.equipment.filter((e) => e.ownership === "owned").length,
  }));

  const totalWorkers = manpowerByDay.reduce((s, d) => s + d.total, 0);
  const avgWorkers =
    manpowerByDay.length > 0
      ? Math.round(totalWorkers / manpowerByDay.length)
      : 0;
  const totalEquipmentDays = equipmentByDay.reduce((s, d) => s + d.count, 0);

  return (
    <AppShell>
      <div className="screen">
        <Header title="Reports" backHref="/" />

        {/* Utilization Snapshot */}
        {weekLogs.length > 0 && (
          <div className="px-5 pt-6">
            <h3 className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase mb-3">
              This Week&apos;s Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <HardHat className="w-5 h-5 text-onyx" />
                  <span className="text-sm font-medium text-warm-gray">
                    Manpower
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-onyx">
                  {avgWorkers}
                </p>
                <p className="text-xs text-warm-gray">avg workers/day</p>
                <p className="text-xs text-warm-gray mt-1">
                  {weekLogs.length} log{weekLogs.length !== 1 ? "s" : ""} this
                  week
                </p>
              </div>
              <div className="bg-glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-5 h-5 text-onyx" />
                  <span className="text-sm font-medium text-warm-gray">
                    Equipment
                  </span>
                </div>
                <p className="text-2xl font-heading font-bold text-onyx">
                  {totalEquipmentDays}
                </p>
                <p className="text-xs text-warm-gray">equipment-days</p>
                <p className="text-xs text-warm-gray mt-1">
                  {equipmentByDay.reduce((s, d) => s + d.rented, 0)} rented /{" "}
                  {equipmentByDay.reduce((s, d) => s + d.owned, 0)} owned
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Reports Section */}
        <div className="px-5 pt-6">
          <h3 className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase mb-4">
            Weekly Reports
          </h3>

          <div className="space-y-3">
            <Link href="/reports/client" className="block no-underline">
              <BigButton
                label="Client / Owner Report"
                sublabel="Professional progress summary"
                icon={<FileBarChart className="w-6 h-6" />}
                variant="light"
              />
            </Link>

            <Link href="/reports/design-team" className="block no-underline">
              <BigButton
                label="Design Team Report"
                sublabel="RFIs, submittals & technical detail"
                icon={<FileText className="w-6 h-6" />}
                variant="light"
              />
            </Link>

            <Link
              href="/reports/subcontractor"
              className="block no-underline"
            >
              <BigButton
                label="Subcontractor Report"
                sublabel="Work completed & coordination"
                icon={<Users className="w-6 h-6" />}
                variant="light"
              />
            </Link>

            <Link
              href="/reports/internal-risk"
              className="block no-underline"
            >
              <BigButton
                label="Internal / Risk Report"
                sublabel="Operations & risk management"
                icon={<ShieldAlert className="w-6 h-6" />}
                variant="light"
              />
            </Link>
          </div>
        </div>

        {/* Other Outputs Section */}
        <div className="px-5 pt-8">
          <h3 className="font-heading text-xs font-medium text-warm-gray tracking-widest uppercase mb-4">
            Other Outputs
          </h3>

          <div className="space-y-3">
            <Link
              href="/reports/change-orders"
              className="block no-underline"
            >
              <BigButton
                label="Change Orders"
                sublabel="Draft from daily log changes"
                icon={<AlertTriangle className="w-6 h-6" />}
                variant="light"
              />
            </Link>

            <Link href="/reports/legal" className="block no-underline">
              <BigButton
                label="Legal Correspondence"
                sublabel="Back-charges, notices & directives"
                icon={<Scale className="w-6 h-6" />}
                variant="light"
              />
            </Link>
          </div>
        </div>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </AppShell>
  );
}
