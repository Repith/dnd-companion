"use client";

import { useState } from "react";

interface SidebarProps {
  className?: string;
  activeModule: string;
  onModuleChange: (module: string) => void;
}

const modules = [
  {
    id: "characters",
    name: "Characters",
    icon: "👤",
  },
  {
    id: "campaigns",
    name: "Campaigns",
    icon: "📜",
  },
  {
    id: "dice",
    name: "Dice Roller",
    icon: "🎲",
  },
  {
    id: "dm-zone",
    name: "DM Zone",
    icon: "🎲",
  },
  {
    id: "generator",
    name: "Generator",
    icon: "⚡",
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: "🎒",
  },
  {
    id: "quests",
    name: "Quests",
    icon: "🏆",
  },
  {
    id: "sessions",
    name: "Sessions",
    icon: "📅",
  },
  {
    id: "spells",
    name: "Spells",
    icon: "✨",
  },
];

export default function Sidebar({
  className = "",
  activeModule,
  onModuleChange,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Modules
          </h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {modules.map((module) => {
          const isActive = activeModule === module.id;
          return (
            <button
              key={module.id}
              onClick={() => onModuleChange(module.id)}
              className={`w-full flex items-center px-3 py-2 rounded-md transition-colors text-left ${
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <span className="mr-3 text-xl">{module.icon}</span>
              {!isCollapsed && (
                <span className="font-medium">{module.name}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
