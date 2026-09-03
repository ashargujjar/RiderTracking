import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { toast } from "react-toastify";

import { getSocket } from "../../lib/socket";
import { Sidebar } from "./Sidebar";
import { SidebarContext } from "./SidebarContext";

export function AppLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  useEffect(() => {
    const socket = getSocket();
    const handleNewComplaint = (complaint: { title?: string }) => {
      toast.info(`New complaint received${complaint?.title ? `: ${complaint.title}` : ""}`);
    };

    socket.on("complaint:new", handleNewComplaint);
    socket.connect();

    return () => {
      socket.off("complaint:new", handleNewComplaint);
      socket.disconnect();
    };
  }, []);

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
