import type { ReactNode } from "react";

interface PanelBentoProps {
  children: ReactNode;
}

export function PanelBento({ children }: PanelBentoProps) {
  return <div className="panel-bento">{children}</div>;
}
