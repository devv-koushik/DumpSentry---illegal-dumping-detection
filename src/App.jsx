import { BrowserRouter, Routes, Route } from "react-router-dom";
import SmoothScroll from "./components/SmoothScroll";
import Landing from "./pages/Landing";
import CommandCenterLayout from "./layouts/CommandCenterLayout";
import Dashboard from "./pages/Dashboard";
import Detections from "./pages/Detections";
import DetectionDetails from "./pages/DetectionDetails";
import UploadAnalyze from "./pages/UploadAnalyze";
import MapPage from "./pages/MapPage";
import Alerts from "./pages/Alerts";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <SmoothScroll>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<CommandCenterLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="detections" element={<Detections />} />
            <Route path="detections/:id" element={<DetectionDetails />} />
            <Route path="upload" element={<UploadAnalyze />} />
            <Route path="map" element={<MapPage />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </SmoothScroll>
  );
}


