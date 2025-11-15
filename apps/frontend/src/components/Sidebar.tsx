"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  LogOut,
} from "lucide-react";
import { modules } from "./modules";

interface SidebarProps {
  className?: string;
  isOpen: boolean;
  onToggle: () => void;
  activeModule: string;
  logout: () => void;
}

export default function Sidebar({
  className = "",
  isOpen,
  onToggle,
  activeModule,
  logout,
}: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-collapse based on screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        // Desktop: fixed, not collapsed
        setIsCollapsed(false);
      } else if (width >= 768) {
        // Tablet: collapsible
        // Keep current state
      } else {
        // Mobile: overlay, collapsed by default
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleModuleClick = (moduleId: string) => {
    router.push(`/dashboard/${moduleId}`);
    // On mobile/tablet, close sidebar after selection
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:relative z-50 flex flex-col bg-sidebar-bg border-r border-sidebar-border transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-64"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e7e5e4' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <h2 className="text-lg font-bold text-foreground">D&D Companion</h2>
          )}

          <div className="flex items-center space-x-2">
            {/* Collapse toggle (desktop/tablet only) */}
            {window.innerWidth >= 768 && (
              <button
                onClick={toggleCollapse}
                className="p-1 transition-colors text-foreground hover:text-accent"
              >
                {isCollapsed ? (
                  <ChevronRight size={20} />
                ) : (
                  <ChevronLeft size={20} />
                )}
              </button>
            )}

            {/* Mobile close button */}
            {window.innerWidth < 768 && (
              <button
                onClick={onToggle}
                className="p-1 transition-colors text-foreground hover:text-accent"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeModule === module.id;
            return (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.id)}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-300 group ${
                  isActive
                    ? "bg-accent text-foreground shadow-md"
                    : "text-foreground hover:bg-accent hover:shadow-sm"
                }`}
              >
                <Icon
                  size={24}
                  className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? "text-accent" : ""
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 font-medium text-left">
                    {module.name}
                  </span>
                )}
              </button>
            );
          })}

          {/* Settings */}
          <button
            onClick={() => router.push("/dashboard/settings")}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group text-foreground hover:bg-accent hover:shadow-sm`}
          >
            <Settings
              size={24}
              className="flex-shrink-0 transition-transform group-hover:scale-110"
            />
            {!isCollapsed && (
              <span className="ml-3 font-medium text-left">Settings</span>
            )}
          </button>

          {/* Logout */}
          <button
            onClick={async () => {
              await logout();
              router.push("/signin");
            }}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 group text-foreground hover:bg-accent hover:shadow-sm`}
          >
            <LogOut
              size={24}
              className="flex-shrink-0 transition-transform group-hover:scale-110"
            />
            {!isCollapsed && (
              <span className="ml-3 font-medium text-left">Logout</span>
            )}
          </button>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="text-xs text-center text-accent">
              May your rolls be high
            </div>
          </div>
        )}
      </div>
    </>
  );
}
