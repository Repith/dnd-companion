"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Menu } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Extract active module from pathname
  const activeModule = pathname.split("/").pop() || "characters";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar - hidden on mobile */}
        {!isMobile && (
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            activeModule={activeModule}
            logout={logout}
          />
        )}

        {/* Mobile Nav */}
        {isMobile && <MobileNav activeModule={activeModule} />}

        {/* Main Content */}
        <div className="flex flex-col flex-1 lg:ml-0">
          {/* Page Content */}
          <main className={`flex-1 p-6 ${isMobile ? "pb-16" : ""}`}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
