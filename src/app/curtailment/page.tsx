import { loadCurtailmentPageData } from "@/lib/frontEnd/curtailment/page";
import { CurtailmentDashboard } from "@/ui/dashboard/DashboardViews";

export default async function CurtailmentPage() {
  const data = await loadCurtailmentPageData();

  return (
    <>
      <h3 className="section-header">Curtailment Intelligence</h3>
      <CurtailmentDashboard data={data} />
    </>
  );
}
