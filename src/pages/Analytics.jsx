import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import PageHeader from "../components/PageHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchAlerts, fetchAnalytics } from "../services/api";

const COLORS = ["#2FCB8A", "#10201A", "#3FB950", "#E5484D", "#566A60", "#8a9584"];

export default function Analytics() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    trend: [],
    categoryData: [],
    statusDistribution: [],
    contextDistribution: [],
  });

  useEffect(() => {
    Promise.all([
      fetchAlerts().catch(() => []),
      fetchAnalytics().catch(() => null),
    ]).then(([alertsRes, liveAnalytics]) => {
      setAlerts(Array.isArray(alertsRes) ? alertsRes : []);
      if (liveAnalytics) {
        setAnalyticsData({
          trend: Array.isArray(liveAnalytics.trend) ? liveAnalytics.trend : [],
          categoryData: Array.isArray(liveAnalytics.categoryData) ? liveAnalytics.categoryData : [],
          statusDistribution: Array.isArray(liveAnalytics.statusDistribution) ? liveAnalytics.statusDistribution : [],
          contextDistribution: Array.isArray(liveAnalytics.contextDistribution) ? liveAnalytics.contextDistribution : [],
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner label="Loading analytics…" />;

  const alertSummary = {
    sent: alerts.filter((a) => a.status === "Sent").length,
    pending: alerts.filter((a) => a.status === "Pending").length,
    failed: alerts.filter((a) => a.status === "Failed").length,
    resolved: alerts.filter((a) => a.status === "Resolved").length,
  };

  return (
    <div>
      <PageHeader title="Analytics" description="Detection and alert trends across all monitored zones." />

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Detection Trend"
          empty={analyticsData.trend.length === 0}
          emptyMessage="No detection trend data recorded yet in the past 7 days."
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analyticsData.trend}>
              <CartesianGrid stroke="rgba(22,36,29,.08)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#566A60" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#566A60" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(22,36,29,.1)", fontSize: 13 }} />
              <Line type="monotone" dataKey="detections" stroke="#2FCB8A" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Waste Categories"
          empty={analyticsData.categoryData.length === 0}
          emptyMessage="No waste categories identified in the database yet."
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analyticsData.categoryData} dataKey="value" nameKey="name" innerRadius={54} outerRadius={90} paddingAngle={2}>
                {analyticsData.categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(22,36,29,.1)", fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Incident Status"
          empty={analyticsData.statusDistribution.length === 0}
          emptyMessage="No incident status breakdown recorded yet."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analyticsData.statusDistribution}>
              <CartesianGrid stroke="rgba(22,36,29,.08)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#566A60" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 12, fill: "#566A60" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(22,36,29,.1)", fontSize: 13 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#10201A" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Context Distribution"
          empty={analyticsData.contextDistribution.length === 0}
          emptyMessage="No environmental context distribution data available yet."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analyticsData.contextDistribution} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="rgba(22,36,29,.08)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: "#566A60" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#566A60" }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(22,36,29,.1)", fontSize: 13 }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#2FCB8A" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6">
        <p className="mb-4 font-medium text-ink">Authority Alerts Summary</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Sent", value: alertSummary.sent, tone: "text-success" },
            { label: "Pending", value: alertSummary.pending, tone: "text-accent-deep" },
            { label: "Failed", value: alertSummary.failed, tone: "text-danger" },
            { label: "Resolved", value: alertSummary.resolved, tone: "text-muted" },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <p className="text-sm text-muted">{s.label}</p>
              <p className={`mt-1.5 font-mono text-2xl font-semibold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, empty = false, emptyMessage = "No surveillance data available" }) {
  return (
    <div className="card p-5">
      <p className="mb-4 font-medium text-ink">{title}</p>
      {empty ? (
        <div className="flex h-[260px] items-center justify-center text-xs text-muted">
          {emptyMessage}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
