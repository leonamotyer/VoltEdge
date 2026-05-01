export type NavIconKey = "curtailment" | "load-storage" | "network-fiber" | "roi" | "executive-summary";

export type SidebarNavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
};

export const sidebarNavItems: SidebarNavItem[] = [
  { id: "executive-summary", label: "Executive Summary", href: "/executive-summary", icon: "executive-summary" },
  { id: "curtailment", label: "Curtailment Intelligence", href: "/curtailment", icon: "curtailment" },
  { id: "load-storage", label: "Load and Storage", href: "/load-and-storage", icon: "load-storage" },
  { id: "roi", label: "ROI & Economics", href: "/roi", icon: "roi" },
  {
    id: "network-fiber",
    label: "Network and Fiber Feasibility",
    href: "/network-and-fiber",
    icon: "network-fiber",
  },
];
