"use client";

import React, { useState, useMemo } from "react";
import { Plus, X, Check, MapPin } from "lucide-react";
import BigButton from "@/components/ui/BigButton";
import Breadcrumb from "@/components/layout/Breadcrumb";
import { CSI_DIVISIONS } from "@/data/csi-divisions";
import { SelectedTask, TaktZone } from "@/lib/types";
import * as LucideIcons from "lucide-react";

interface TaskSelectorProps {
  taktZones: TaktZone[];
  selectedTasks: SelectedTask[];
  onTasksChange: (tasks: SelectedTask[]) => void;
}

type NavigationLevel = 1 | 2 | 3 | 4;

export default function TaskSelector({
  taktZones,
  selectedTasks,
  onTasksChange,
}: TaskSelectorProps) {
  const [currentLevel, setCurrentLevel] = useState<NavigationLevel>(1);
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedTaskName, setSelectedTaskName] = useState<string | null>(null);
  const [showSelectedModal, setShowSelectedModal] = useState(false);

  const currentDivision = useMemo(
    () => CSI_DIVISIONS.find((d) => d.code === selectedDivision),
    [selectedDivision]
  );

  const currentActivity = useMemo(
    () => currentDivision?.activities.find((a) => a.id === selectedActivity),
    [currentDivision, selectedActivity]
  );

  const groupedZones = useMemo(() => {
    const groups: { [key: string]: TaktZone[] } = {};
    taktZones.forEach((zone) => {
      if (!groups[zone.floor]) {
        groups[zone.floor] = [];
      }
      groups[zone.floor].push(zone);
    });
    return groups;
  }, [taktZones]);

  const isTaskSelected = (task: SelectedTask): boolean => {
    return selectedTasks.some(
      (t) =>
        t.csiDivision === task.csiDivision &&
        t.activity === task.activity &&
        t.task === task.task &&
        t.taktZone === task.taktZone
    );
  };

  const getLucideIcon = (iconName: string) => {
    const iconComponent =
      (LucideIcons as unknown as Record<string, React.ComponentType<Record<string, unknown>>>)[iconName] ||
      LucideIcons.Package;
    return React.createElement(iconComponent, {
      size: 24,
      className: "text-onyx",
    });
  };

  const handleDivisionSelect = (divisionCode: string) => {
    setSelectedDivision(divisionCode);
    setSelectedActivity(null);
    setSelectedTaskName(null);
    setCurrentLevel(2);
  };

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivity(activityId);
    setSelectedTaskName(null);
    setCurrentLevel(3);
  };

  const handleTaskSelect = (taskName: string) => {
    setSelectedTaskName(taskName);
    setCurrentLevel(4);
  };

  const handleZoneSelect = (zoneId: string) => {
    if (!selectedDivision || !selectedActivity || !selectedTaskName) return;

    const newTask: SelectedTask = {
      csiDivision: selectedDivision,
      activity: selectedActivity,
      task: selectedTaskName,
      taktZone: zoneId,
    };

    const isDuplicate = selectedTasks.some(
      (t) =>
        t.csiDivision === newTask.csiDivision &&
        t.activity === newTask.activity &&
        t.task === newTask.task &&
        t.taktZone === newTask.taktZone
    );

    if (!isDuplicate) {
      onTasksChange([...selectedTasks, newTask]);
    }

    setCurrentLevel(2);
    setSelectedActivity(null);
    setSelectedTaskName(null);
  };

  const handleRemoveTask = (task: SelectedTask) => {
    onTasksChange(
      selectedTasks.filter(
        (t) =>
          !(
            t.csiDivision === task.csiDivision &&
            t.activity === task.activity &&
            t.task === task.task &&
            t.taktZone === task.taktZone
          )
      )
    );
  };

  const handleBreadcrumbClick = (level: NavigationLevel) => {
    setCurrentLevel(level);
    if (level === 1) {
      setSelectedDivision(null);
      setSelectedActivity(null);
      setSelectedTaskName(null);
    } else if (level === 2) {
      setSelectedActivity(null);
      setSelectedTaskName(null);
    } else if (level === 3) {
      setSelectedTaskName(null);
    }
  };

  const getBreadcrumbItems = () => {
    const items: Array<{ label: string; onClick?: () => void }> = [
      {
        label: "All",
        onClick: () => handleBreadcrumbClick(1),
      },
    ];

    if (currentDivision && currentLevel >= 2) {
      items.push({
        label: `Div ${currentDivision.code} ${currentDivision.name}`,
        onClick: () => handleBreadcrumbClick(2),
      });
    }

    if (currentActivity && currentLevel >= 3) {
      items.push({
        label: currentActivity.name,
        onClick: () => handleBreadcrumbClick(3),
      });
    }

    if (selectedTaskName && currentLevel === 4) {
      items.push({
        label: selectedTaskName,
      });
    }

    return items;
  };

  return (
    <div className="flex flex-col h-screen bg-surface-base">
      <Breadcrumb items={getBreadcrumbItems()} />

      <div className="flex-1 overflow-y-auto px-4 py-4 animate-fade-in">
        {currentLevel === 1 && (
          <div className="space-y-2 pb-24">
            <h2 className="text-heading font-bold text-onyx mb-4">
              Select Division
            </h2>
            {CSI_DIVISIONS.map((division) => (
              <BigButton
                key={division.code}
                label={`Div ${division.code}`}
                sublabel={division.name}
                icon={getLucideIcon(division.icon)}
                onClick={() => handleDivisionSelect(division.code)}
                chevron
              />
            ))}
          </div>
        )}

        {currentLevel === 2 && currentDivision && (
          <div className="space-y-2 pb-24">
            <h2 className="text-heading font-bold text-onyx mb-4">
              {currentDivision.name} — Activities
            </h2>
            {currentDivision.activities.map((activity) => {
              const activityTaskCount = activity.tasks.length;
              return (
                <BigButton
                  key={activity.id}
                  label={activity.name}
                  sublabel={`${activityTaskCount} task${activityTaskCount !== 1 ? "s" : ""}`}
                  icon={<Plus size={20} className="text-onyx" />}
                  onClick={() => handleActivitySelect(activity.id)}
                  chevron
                />
              );
            })}
          </div>
        )}

        {currentLevel === 3 && currentActivity && (
          <div className="space-y-2 pb-24">
            <h2 className="text-heading font-bold text-onyx mb-4">
              {currentActivity.name} — Tasks
            </h2>
            {currentActivity.tasks.map((task) => {
              const taskSelected = selectedTasks.some(
                (t) =>
                  t.csiDivision === selectedDivision &&
                  t.activity === selectedActivity &&
                  t.task === task
              );
              return (
                <BigButton
                  key={task}
                  label={task}
                  icon={
                    taskSelected ? (
                      <Check size={20} className="text-accent-green" />
                    ) : (
                      <Plus size={20} className="text-onyx" />
                    )
                  }
                  badge={taskSelected ? "Selected" : undefined}
                  badgeColor="green"
                  onClick={() => handleTaskSelect(task)}
                  chevron
                />
              );
            })}
          </div>
        )}

        {currentLevel === 4 && currentActivity && selectedTaskName && (
          <div className="space-y-2 pb-24">
            <h2 className="text-heading font-bold text-onyx mb-4">
              Select Takt Zone
            </h2>
            {Object.entries(groupedZones).map(([floor, zones]) => (
              <div key={floor}>
                <div className="text-sm font-semibold text-warm-gray px-1 py-2 sticky top-0 bg-surface-base">
                  {floor}
                </div>
                <div className="space-y-2">
                  {zones.map((zone) => {
                    const zoneTask: SelectedTask = {
                      csiDivision: selectedDivision!,
                      activity: selectedActivity!,
                      task: selectedTaskName,
                      taktZone: zone.id,
                    };
                    const isSelected = isTaskSelected(zoneTask);
                    return (
                      <BigButton
                        key={zone.id}
                        label={zone.zoneName}
                        sublabel={zone.zoneCode}
                        icon={
                          isSelected ? (
                            <Check size={20} className="text-accent-green" />
                          ) : (
                            <MapPin size={20} className="text-onyx" />
                          )
                        }
                        badge={isSelected ? "Added" : undefined}
                        badgeColor="green"
                        onClick={() => handleZoneSelect(zone.id)}
                        chevron={false}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 bg-white px-4 py-3 sticky bottom-0">
        <button
          onClick={() => setShowSelectedModal(true)}
          className="w-full min-h-[56px] rounded-card bg-accent-violet text-white font-semibold font-body transition-all hover:bg-glass-heavy active:scale-[0.98] flex items-center justify-center"
        >
          <span>{selectedTasks.length} Task</span>
          <span>{selectedTasks.length !== 1 ? "s" : ""}</span>
          <span className="ml-2">Selected</span>
        </button>
      </div>

      {showSelectedModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 shadow-lg max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading font-bold text-onyx">
                Selected Tasks ({selectedTasks.length})
              </h2>
              <button
                onClick={() => setShowSelectedModal(false)}
                className="p-2 hover:hover:bg-glass-light rounded-lg transition-colors"
              >
                <X size={20} className="text-onyx" />
              </button>
            </div>

            {selectedTasks.length === 0 ? (
              <p className="text-center text-warm-gray py-8">
                No tasks selected yet
              </p>
            ) : (
              <div className="space-y-2">
                {selectedTasks.map((task, index) => {
                  const division = CSI_DIVISIONS.find(
                    (d) => d.code === task.csiDivision
                  );
                  const activity = division?.activities.find(
                    (a) => a.id === task.activity
                  );
                  const zone = taktZones.find((z) => z.id === task.taktZone);

                  return (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-3 p-3 bg-glass-light rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-onyx">
                          {task.task}
                        </div>
                        <div className="text-xs text-warm-gray mt-1">
                          {division?.name} • {activity?.name}
                        </div>
                        {zone && (
                          <div className="text-xs text-warm-gray">
                            {zone.zoneName} ({zone.zoneCode})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveTask(task)}
                        className="flex-shrink-0 p-2 hover:hover:bg-glass-light rounded-lg transition-colors"
                      >
                        <X size={16} className="text-onyx" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowSelectedModal(false)}
              className="w-full mt-6 min-h-[48px] rounded-card bg-accent-green text-white font-semibold font-body transition-all hover:bg-opacity-90 active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
