"use client";

import { useRouter } from "next/navigation";
import { modules } from "./modules";

interface MobileNavProps {
  activeModule: string;
}

export default function MobileNav({ activeModule }: MobileNavProps) {
  const router = useRouter();

  const handleModuleClick = (moduleId: string) => {
    router.push(`/dashboard/${moduleId}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-sidebar-bg border-sidebar-border md:hidden">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = activeModule === module.id;
        return (
          <button
            key={module.id}
            onClick={() => handleModuleClick(module.id)}
            className={`flex-1 flex flex-col items-center justify-center min-h-11 py-2 transition-colors ${
              isActive
                ? "bg-accent text-foreground"
                : "text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon size={24} />
          </button>
        );
      })}
    </div>
  );
}
