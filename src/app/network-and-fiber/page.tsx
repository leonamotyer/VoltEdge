import { loadNetworkAndFiberPageData } from "@/lib/frontEnd/networkAndFiber/page";
import { NetworkDashboard } from "@/lib/frontEnd/ui/dashboard/DashboardViews";

export default async function NetworkAndFiberPage() {
  const data = await loadNetworkAndFiberPageData();

  return (
    <>
      <h3 className="section-header">Network and Fiber Feasibility</h3>
      <NetworkDashboard data={data} />
    </>
  );
}
