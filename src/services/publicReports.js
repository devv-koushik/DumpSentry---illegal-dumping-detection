/**
 * Public Reports Storage & Service
 * Stores public citizen reports in localStorage (and syncs with API if backend is online)
 */

const STORAGE_KEY = "dumpsentry_public_reports";

const INITIAL_REPORTS = [
  {
    id: "PUB-8192",
    problemType: "Illegal Garbage Dumping",
    context: "Hospital / Healthcare Facility",
    location: "Adjacent to Kasba Community Health Center, Ward 107",
    landmark: "Behind Emergency Ward Boundary Wall",
    description: "Continuous dumping of mixed hospital and solid waste during early morning hours. Stray animals scattering plastic bags onto the main access driveway.",
    reporterName: "Dr. A. Sen",
    reporterContact: "asen.health@kasba.org",
    imagePreview: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
    status: "Pending Review",
    priority: "High",
    timestamp: "2026-03-29T14:32:00.000Z",
    assignedAuthority: "Kasba Municipal Borough / Hospital Superintendent",
  },
  {
    id: "PUB-6421",
    problemType: "Construction Debris / C&D Waste",
    context: "School / College / University",
    location: "New Town Major Arterial Road, Near DPS School",
    landmark: "Footpath opposite Gate 3",
    description: "Dump truck unloaded concrete rubble and broken tiles along the pedestrian footpath, blocking school buses and students walking to the campus.",
    reporterName: "P. Mukherjee (Parent Committee)",
    reporterContact: "+91 98301 44521",
    imagePreview: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80",
    status: "Drone Dispatched",
    priority: "Urgent",
    timestamp: "2026-03-29T11:15:00.000Z",
    assignedAuthority: "New Town Kolkata Development Authority (NKDA)",
  },
  {
    id: "PUB-4039",
    problemType: "Overflowing Public Bin / Drain Blockage",
    context: "Roadside / Highway Corridor",
    location: "EM Bypass Corridor, Near Ruby Hospital Crossing",
    landmark: "Under pedestrian flyover pillar 42",
    description: "Public bin overflowing for 4 days, waste spilling into open roadside stormwater drain. Risk of monsoon waterlogging.",
    reporterName: "Rohan Ghosh",
    reporterContact: "rohan.g@gmail.com",
    imagePreview: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop&q=80",
    status: "Resolved",
    priority: "Medium",
    timestamp: "2026-03-28T09:40:00.000Z",
    assignedAuthority: "Kolkata Municipal Corporation (KMC) SWM",
  },
];

export function getPublicReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
}

export function savePublicReport(report) {
  try {
    const existing = getPublicReports();
    const updated = [report, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch a custom event so other components or tabs update instantly
    window.dispatchEvent(new Event("dumpsentry_reports_updated"));
    return updated;
  } catch (err) {
    console.error("Failed to save report:", err);
    return [];
  }
}

export function updateReportStatus(reportId, newStatus) {
  try {
    const existing = getPublicReports();
    const updated = existing.map((r) =>
      r.id === reportId ? { ...r, status: newStatus } : r
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("dumpsentry_reports_updated"));
    return updated;
  } catch (err) {
    console.error("Failed to update report status:", err);
    return [];
  }
}
