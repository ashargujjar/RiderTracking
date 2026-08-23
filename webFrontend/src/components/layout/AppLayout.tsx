import { useState } from "react";
import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { SidebarContext } from "./SidebarContext";

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        isDesktopOpen,
        toggleDesktop: () => setIsDesktopOpen((prev) => !prev),
      }}
    >
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
