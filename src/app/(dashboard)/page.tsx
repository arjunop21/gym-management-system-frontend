"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, CreditCard, Activity, Ban, MessageSquare, Filter, CalendarDays } from "lucide-react";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";

const PAGE_SIZE = 5;

const DAY_FILTER_OPTIONS = [
  { label: "All (within 7 days)", value: "all" },
  { label: "Today (0 days)", value: "0" },
  { label: "1–2 days", value: "1-2" },
  { label: "3–5 days", value: "3-5" },
  { label: "6–7 days", value: "6-7" },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    monthlyRevenue: 0,
  });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringPage, setExpiringPage] = useState(1);
  const [dayFilter, setDayFilter] = useState("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, expiringRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/members/expiring-soon")
        ]);
        setStats(statsRes.data);
        setExpiringMembers(expiringRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sendWhatsAppReminder = (member: any) => {
    if (!member.phone) return;
    const phone = member.phone.replace(/\D/g, '');
    const message = `Hello ${member.name}, your gym membership will expire in ${member.daysRemaining} days. Please renew your membership to continue enjoying our services.`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  // Filter by days remaining
  const filteredExpiring = expiringMembers.filter((m) => {
    const d = m.daysRemaining;
    if (dayFilter === "all") return true;
    if (dayFilter === "0") return d === 0;
    if (dayFilter === "1-2") return d >= 1 && d <= 2;
    if (dayFilter === "3-5") return d >= 3 && d <= 5;
    if (dayFilter === "6-7") return d >= 6 && d <= 7;
    return true;
  });

  const handleDayFilterChange = (val: string) => {
    setDayFilter(val);
    setExpiringPage(1);
  };

  // Pagination
  const expiringTotalPages = Math.ceil(filteredExpiring.length / PAGE_SIZE);
  const paginatedExpiring = filteredExpiring.slice(
    (expiringPage - 1) * PAGE_SIZE,
    expiringPage * PAGE_SIZE
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Overview</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-medium text-sm text-[var(--muted-foreground)]">
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="bg-blue-100 text-blue-600" />
        <StatCard title="Active Members" value={stats.activeMembers} icon={Activity} color="bg-green-100 text-green-600" />
        <StatCard title="Expired Members" value={stats.expiredMembers} icon={Ban} color="bg-red-100 text-red-600" />
        <StatCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon={CreditCard} color="bg-[var(--accent)] text-[var(--foreground)]" />
      </div>

      <div className="pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">

          {/* Header */}
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Quick Action For Late Payments</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Expiring within the next 7 days
                {expiringMembers.length > 0 && (
                  <span className="ml-2 inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {expiringMembers.length} members
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Days Remaining Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
                <select
                  value={dayFilter}
                  onChange={(e) => handleDayFilterChange(e.target.value)}
                  className="pl-8 pr-4 py-2 text-sm border border-[var(--separator)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none bg-white appearance-none cursor-pointer font-medium text-[var(--foreground)] shadow-sm"
                >
                  {DAY_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Send to All */}
              {expiringMembers.length > 0 && (
                <button
                  onClick={() => expiringMembers.forEach(m => sendWhatsAppReminder(m))}
                  className="text-sm font-semibold bg-green-100 text-green-700 px-4 py-2 rounded-xl hover:bg-green-200 transition whitespace-nowrap"
                >
                  Send to All
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Member Name</th>
                  <th className="p-4 font-bold">Phone Number</th>
                  <th className="p-4 font-bold">Days Remaining</th>
                  <th className="p-4 font-bold">Expiry Date</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpiring.map((member: any) => (
                  <tr key={member._id} className={`border-b last:border-0 transition-colors ${member.daysRemaining === 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                    <td className="p-4 font-semibold text-[var(--foreground)]">{member.name}</td>
                    <td className="p-4 text-sm font-medium text-[var(--muted-foreground)]">{member.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        member.daysRemaining === 0
                          ? 'bg-red-200 text-red-800'
                          : member.daysRemaining <= 2
                          ? 'bg-red-100 text-red-700'
                          : member.daysRemaining <= 5
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {member.daysRemaining === 0 ? 'Today' : `${member.daysRemaining} ${member.daysRemaining === 1 ? 'day' : 'days'}`}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                        <CalendarDays size={14} className={member.daysRemaining <= 2 ? 'text-red-400' : 'text-orange-400'} />
                        {member.expiryDate ? format(new Date(member.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        disabled={!member.phone}
                        onClick={() => sendWhatsAppReminder(member)}
                        title={member.phone ? "Send WhatsApp Reminder" : "No phone number available"}
                        className="inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <MessageSquare size={14} /> Send Reminder
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpiring.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-green-600 font-medium bg-green-50/50">
                      {expiringMembers.length === 0
                        ? "All good! No memberships are expiring within the next 7 days."
                        : "No members match the selected filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={expiringPage}
            totalPages={expiringTotalPages}
            onPageChange={(p) => setExpiringPage(p)}
            totalItems={filteredExpiring.length}
            itemsPerPage={PAGE_SIZE}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex items-center justify-between transition-all hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
      </div>
      <div className={`p-4 rounded-full ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
