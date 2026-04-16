export type NavIconKey = "curtailment" | "load-storage" | "network-fiber";

export type SidebarNavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { id: "curtailment", label: "Curtailment Intelligence", href: "/curtailment", icon: "curtailment" },
  { id: "load-storage", label: "Load and Storage", href: "/load-and-storage", icon: "load-storage" },
  {
    id: "network-fiber",
    label: "Network and Fiber Feasibility",
    href: "/network-and-fiber",
    icon: "network-fiber",
  },
];
