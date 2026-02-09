"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db, getProjectsForUser } from "@/lib/db";
import { DEMO_PROJECT } from "@/data/demo-project";
import type { Project } from "@/lib/types";
import {
  Building2,
  MapPin,
  Calendar,
  Users,
  ChevronRight,
  LogOut,
  DollarSign,
} from "lucide-react";

export default function SelectProjectPage() {
  const router = useRouter();
  const { currentUser, setActiveProject, logout } = useAppStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.replace("/login");
    }
  }, [currentUser, router]);

  // Load projects
  useEffect(() => {
    async function loadProjects() {
      // Ensure demo project exists
      const projectCount = await db.projects.count();
      if (projectCount === 0) {
        await db.projects.put(DEMO_PROJECT);
      }

      if (currentUser) {
        const userProjects = await getProjectsForUser(currentUser.id);
        setProjects(userProjects);
      }
      setLoading(false);
    }
    loadProjects();
  }, [currentUser]);

  const handleProjectSelect = (project: Project) => {
    setActiveProject(project);
    router.push("/");
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-onyx flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-14 pb-6">
        <div>
          <p className="text-white/50 text-sm">Welcome back,</p>
          <h1 className="font-heading text-2xl font-bold text-white mt-0.5">
            {currentUser.name.split(" ")[0]}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Content Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-safe-bottom">
        <h2 className="font-heading text-xl font-semibold text-onyx mb-1">
          Select a Project
        </h2>
        <p className="text-field-sm text-warm-gray mb-6">
          Choose a project to get started
        </p>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={48} className="text-warm-gray/40 mx-auto mb-4" />
            <p className="font-heading font-semibold text-onyx mb-1">
              No Projects Assigned
            </p>
            <p className="text-field-sm text-warm-gray">
              Contact your administrator to get access to a project.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className="w-full bg-alabaster border border-gray-100 rounded-xl p-5 text-left active:scale-[0.98] transition-transform hover:border-gray-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-onyx rounded-xl flex items-center justify-center">
                    <Building2 size={24} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-onyx truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-warm-gray text-sm mt-1">
                      <MapPin size={14} className="flex-shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>

                    {/* Project meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-warm-gray">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {project.subcontractors.length} subs
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(project.startDate)} &ndash; {formatDate(project.endDate)}
                      </span>
                      {project.contractValue && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {formatCurrency(project.contractValue)}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} className="flex-shrink-0 text-warm-gray mt-3" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
