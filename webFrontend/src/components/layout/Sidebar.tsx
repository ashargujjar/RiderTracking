import { ChevronRight, LogOut, PanelLeftClose, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { clearToken } from "../../api/client";
import { NAV_SECTIONS } from "../../data/navigation";
import { useSidebar } from "./SidebarContext";

function SidebarContent({ onNavigate, onCollapse }: { onNavigate: () => void; onCollapse?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (section: (typeof NAV_SECTIONS)[number]) =>
    section.exact ? location.pathname === section.path : location.pathname.startsWith(section.path);

  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-primary-dark">
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <span className="text-lg font-bold text-white">Catkin Admin</span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {NAV_SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = isActive(section);
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => {
                navigate(section.path);
                onNavigate();
              }}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {section.label}
            </button>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => {
            clearToken();
            navigate("/login");
          }}
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { isOpen, close, isDesktopOpen, toggleDesktop } = useSidebar();

  return (
    <>
      <div
        className={`hidden overflow-hidden transition-[width] duration-200 lg:block ${
          isDesktopOpen ? "w-64" : "w-0"
        }`}
      >
        <SidebarContent onNavigate={() => {}} onCollapse={toggleDesktop} />
      </div>

      {!isDesktopOpen && (
        <button
          type="button"
          onClick={toggleDesktop}
          className="fixed top-20 left-0 z-10 hidden h-10 w-6 cursor-pointer items-center justify-center rounded-r-lg bg-primary-dark text-white/80 transition hover:bg-primary-dark/90 hover:text-white lg:flex"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative flex h-full">
            <SidebarContent onNavigate={close} />
            <button
              type="button"
              onClick={close}
              className="absolute -right-10 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
