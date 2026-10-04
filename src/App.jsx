import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SmoothScroll from "./components/SmoothScroll";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing from "./pages/Landing";
import { fetchAllWards } from "./services/wardService";
import LoadingSpinner from "./components/LoadingSpinner";

const CommandCenterLayout = lazy(() => import("./layouts/CommandCenterLayout"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Detections = lazy(() => import("./pages/Detections"));
const DetectionDetails = lazy(() => import("./pages/DetectionDetails"));
const UploadAnalyze = lazy(() => import("./pages/UploadAnalyze"));
const MapPage = lazy(() => import("./pages/MapPage"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicReports = lazy(() => import("./pages/PublicReports"));

export default function App() {
  useEffect(() => {
    fetchAllWards();
  }, []);

  return (
    <ErrorBoundary>
      <SmoothScroll>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-paper"><LoadingSpinner label="Loading Dashboard..." /></div>}>
                <CommandCenterLayout />
              </Suspense>
            }>
              <Route index element={<Dashboard />} />
              <Route path="detections" element={<Detections />} />
              <Route path="detections/:id" element={<DetectionDetails />} />
              <Route path="upload" element={<UploadAnalyze />} />
              <Route path="map" element={<MapPage />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="reports" element={<PublicReports />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Landing />} />
          </Routes>
        </BrowserRouter>
      </SmoothScroll>
    </ErrorBoundary>
  );
}
