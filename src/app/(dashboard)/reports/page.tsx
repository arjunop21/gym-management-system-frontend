"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import {
  PieChart as PieChartIcon, TrendingUp, RefreshCw,
  Loader2, Calendar, BarChart2, Filter,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

// ── Colour palette ──────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  Active:  "#22c55e",
  Expired: "#ef4444",
};

// ── Custom Tooltips ─────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      <p className="text-[var(--primary)] font-semibold">₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

const StatusTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-bold text-gray-700">{name}</p>
      <p className="text-gray-500">{value} member{value !== 1 ? "s" : ""}</p>
    </div>
  );
};

// ── Types ───────────────────────────────────────────────────────────────────
type ReportType  = "monthly" | "yearly";

const MONTH_NAMES = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

// ── Helper ──────────────────────────────────────────────────────────────────
const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-based

function buildYearOptions() {
  const years = [];
  for (let y = currentYear; y >= currentYear - 5; y--) years.push(y);
  return years;
}

export default function ReportsPage() {
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [memberStatusData, setMemberStatusData] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter state
  const [reportType, setReportType] = useState<ReportType>("monthly");
  const [selectedYear,  setSelectedYear]  = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  // ── Fetch dynamic chart data ──────────────────────────────────────────────
  const fetchChartData = useCallback(async (silent = false, type?: ReportType, month?: number, year?: number) => {
    if (!silent) setLoading(true);
    else         setRefreshing(true);

    const t = type  ?? reportType;
    const m = month ?? selectedMonth;
    const y = year  ?? selectedYear;

    try {
      const params: Record<string, string> = { type: t, year: String(y) };
      if (t === "monthly") params.month = String(m);
      const { data } = await api.get("/reports/dynamic", { params });
      setRevenueData(data.revenueData);
      setMemberStatusData(data.memberStatusData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("fetchChartData error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [reportType, selectedMonth, selectedYear]);

  useEffect(() => { fetchChartData(); }, []);

  // ── Apply filter handler ──────────────────────────────────────────────────
  const handleApplyFilter = () => {
    fetchChartData(false, reportType, selectedMonth, selectedYear);
  };

  // ── Report type change ────────────────────────────────────────────────────
  const handleTypeChange = (t: ReportType) => {
    setReportType(t);
    if (t === "monthly") setSelectedMonth(currentMonth);
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    if (reportType === "monthly" && y === currentYear && selectedMonth > currentMonth) {
      setSelectedMonth(currentMonth);
    }
  };

  const handleMonthChange = (m: number) => {
    if (selectedYear === currentYear && m > currentMonth) return;
    setSelectedMonth(m);
  };

  // ── Summary computations ──────────────────────────────────────────────────
  const totalRevenue     = revenueData.reduce((s, d) => s + d.revenue, 0);
  const nonZeroPoints    = revenueData.filter(d => d.revenue > 0);
  const peakPoint        = revenueData.reduce((a, b) => b.revenue > a.revenue ? b : a, { name: "—", revenue: 0 });
  const avgRevenue       = nonZeroPoints.length ? Math.round(totalRevenue / nonZeroPoints.length) : 0;
  const totalForPie      = memberStatusData.reduce((s, d) => s + d.value, 0);

  const chartTitle = reportType === "monthly"
    ? `Revenue Report for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
    : `Revenue Report for Year ${selectedYear}`;

  const peakLabel = reportType === "monthly"
    ? (peakPoint.name !== "—" ? `Day ${peakPoint.name}` : "—")
    : peakPoint.name;

  const avgLabel      = reportType === "monthly" ? "Daily Avg"  : "Monthly Avg";
  const peakCardLabel = reportType === "monthly" ? "Peak Day" : "Peak Month";

  if (loading) return (
    <div className="p-8 text-center text-gray-400 flex items-center justify-center gap-2 h-64">
      <RefreshCw size={18} className="animate-spin" /> Loading analytics data…
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytics &amp; Reports</h1>
          <p className="text-[var(--muted-foreground)] text-sm flex items-center gap-2 mt-0.5">
            Insights into gym performance and revenue
            {lastUpdated && (
              <span className="text-xs text-gray-400">· Updated {format(lastUpdated, "hh:mm a")}</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => fetchChartData(true)} disabled={refreshing}
            className="flex items-center gap-2 bg-white text-[var(--foreground)] border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Filter Section ── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-[var(--separator)]">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Filter Reports</h2>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Report Type</label>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(["monthly", "yearly"] as ReportType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`px-5 py-2 text-sm font-semibold transition-all ${
                    reportType === t
                      ? "bg-[var(--primary)] text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {t === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>

          {reportType === "monthly" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Month</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(Number(e.target.value))}
                  className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer"
                >
                  {MONTH_NAMES.map((mn, idx) => {
                    const m = idx + 1;
                    const isFuture = selectedYear === currentYear && m > currentMonth;
                    return (
                      <option key={m} value={m} disabled={isFuture}>
                        {mn}{isFuture ? " (future)" : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
            <div className="relative">
              <BarChart2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="pl-8 pr-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent appearance-none cursor-pointer"
              >
                {buildYearOptions().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleApplyFilter}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[var(--primary)] text-white px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={15} className="animate-spin" /> : <Filter size={15} />}
            {refreshing ? "Loading…" : "Apply Filter"}
          </button>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Line Chart: Revenue ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-[var(--primary)]" size={20} /> Revenue Growth
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{chartTitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Revenue",  value: `₹${totalRevenue.toLocaleString()}` },
              { label: peakCardLabel,    value: peakPoint.revenue > 0 ? `${peakLabel} · ₹${peakPoint.revenue.toLocaleString()}` : "—" },
              { label: avgLabel,         value: avgRevenue > 0 ? `₹${avgRevenue.toLocaleString()}` : "—" },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl px-3 py-2 text-center">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-0.5">{s.label}</p>
                <p className="text-sm font-bold text-[var(--foreground)] truncate">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="h-72">
            {nonZeroPoints.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium flex-col gap-2">
                <BarChart2 size={32} className="text-gray-300" />
                <span>No revenue data available for this period</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3de" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b705c"
                    fontSize={reportType === "monthly" ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    interval={reportType === "monthly" ? 4 : 0}
                  />
                  <YAxis
                    stroke="#6b705c"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => v === 0 ? "₹0" : `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ r: reportType === "monthly" ? 2 : 4, fill: "var(--primary)", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Pie Chart: Member Status ── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <PieChartIcon className="text-[var(--primary)]" size={20} /> Member Status
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {reportType === "monthly"
                  ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                  : `Year ${selectedYear}`}
                {" · "}{totalForPie} total member{totalForPie !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {totalForPie === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm font-medium h-72 flex-col gap-2">
              <BarChart2 size={32} className="text-gray-300" />
              <span>No member data available for this period</span>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberStatusData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={100} paddingAngle={3}
                      dataKey="value" stroke="none"
                      label={({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return percent > 0.05 ? (
                          <text x={x} y={y} fill="white" textAnchor="middle"
                            dominantBaseline="central" fontSize={13} fontWeight={700}>
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                      labelLine={false}
                    >
                      {memberStatusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip content={<StatusTooltip />} />
                    <Legend
                      verticalAlign="bottom" iconType="circle" iconSize={10}
                      formatter={(value) => (
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {memberStatusData.map((d) => (
                  <div key={d.name} className="rounded-xl px-3 py-2.5 text-center"
                    style={{ backgroundColor: (STATUS_COLORS[d.name] || "#94a3b8") + "18" }}>
                    <p className="text-2xl font-extrabold" style={{ color: STATUS_COLORS[d.name] || "#94a3b8" }}>
                      {d.value}
                    </p>
                    <p className="text-[11px] text-gray-500 font-semibold mt-0.5">{d.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
