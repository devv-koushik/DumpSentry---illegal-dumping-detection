import { Outlet, useLocation } from "react-router-dom";
import TopBar from "../components/dashboard/TopBar";

export default function CommandCenterLayout() {
  const location = useLocation();

  // The main dashboard (index) renders the full command center
  // Other pages render inside a light shell with the top bar
  const isIndex = location.pathname === "/dashboard";

  if (isIndex) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-paper font-cmd">
      <TopBar />
      <main className="pt-16 px-5 pb-8 max-w-6xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
