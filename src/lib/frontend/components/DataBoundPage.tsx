import type { ReactNode } from "react";
import { InvalidDataPanel } from "../ui/components/InvalidDataPanel";

interface DataBoundPageProps<T> {
  loader: () => unknown;
  guard: (data: unknown) => data is T;
  routeLabel: string;
  children: (data: T) => ReactNode;
}

export function DataBoundPage<T>({ loader, guard, routeLabel, children }: DataBoundPageProps<T>) {
  const data = loader();
  
  if (!guard(data)) {
    return (
      <>
        <h3 className="section-header">{routeLabel}</h3>
        <InvalidDataPanel routeLabel={routeLabel} data={data} />
      </>
    );
  }
  
  return <>{children(data)}</>;
}
