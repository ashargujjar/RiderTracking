import { Bike, ClipboardList, LayoutDashboard, Users, Wallet, type LucideIcon } from "lucide-react";

export type NavSection = {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const NAV_SECTIONS: NavSection[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, exact: true },
  { key: "clients", label: "Clients", path: "/dashboard/clients", icon: Users },
  { key: "riders", label: "Riders", path: "/dashboard/riders", icon: Bike },
  { key: "complaints", label: "Complaints", path: "/dashboard/complaints", icon: ClipboardList },
  { key: "payments", label: "Payments", path: "/dashboard/payments", icon: Wallet },
];
