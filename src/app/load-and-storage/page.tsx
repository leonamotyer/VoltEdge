import { loadLoadAndStoragePageData } from "@/lib/frontEnd/loadAndStorage/page";
import { LoadStorageDashboard } from "@/lib/frontEnd/ui/dashboard/DashboardViews";

export default async function LoadAndStoragePage() {
  const data = await loadLoadAndStoragePageData();

  return (
    <>
      <h3 className="section-header">Load and Storage</h3>
      <LoadStorageDashboard data={data} />
    </>
  );
}
