/**
 * Public Reports Storage & Service
 * Stores public citizen reports in localStorage (and syncs with API if backend is online)
 */

import { request } from "./api.js";

// Notify frontend components that reports updated
const triggerUpdate = () => {
  window.dispatchEvent(new Event("dumpsentry_reports_updated"));
};

export async function getPublicReports() {
  try {
    const reports = await request("/reports");
    return Array.isArray(reports) ? reports : [];
  } catch (err) {
    console.error("Failed to fetch public reports:", err);
    return [];
  }
}

export async function savePublicReport(report) {
  try {
    await request("/reports", {
      method: "POST",
      body: JSON.stringify(report),
    });
    triggerUpdate();
    return getPublicReports();
  } catch (err) {
    console.error("Failed to save report:", err);
    throw err;
  }
}

export async function updateReportStatus(reportId, newStatus) {
  try {
    await request(`/reports/${reportId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    triggerUpdate();
    return getPublicReports();
  } catch (err) {
    console.error("Failed to update report status:", err);
    throw err;
  }
}

export async function deleteReport(reportId) {
  try {
    await request(`/reports/${reportId}`, {
      method: "DELETE",
    });
    triggerUpdate();
    return getPublicReports();
  } catch (err) {
    console.error("Failed to delete report:", err);
    throw err;
  }
}
