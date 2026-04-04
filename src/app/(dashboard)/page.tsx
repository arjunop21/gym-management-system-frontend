"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Users, CreditCard, Activity, Ban, MessageSquare,
  Filter, CalendarDays, ChevronRight, SkipForward,
  X, Send, Loader2, CheckCircle2, PhoneCall
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { format } from "date-fns";

const PAGE_SIZE = 5;

const DAY_FILTER_OPTIONS = [
  { label: "All (within 7 days)", value: "all", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Today (0 days)", value: "0", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "1–2 days", value: "1-2", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "3–5 days", value: "3-5", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "6–7 days", value: "6-7", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
];

// ─── Queue State Types ─────────────────────────────────────────────
type QueueState = "idle" | "running" | "done";

// ─── Utilities ────────────────────────────────────────────────────
function applyDayFilter(members: any[], filter: string): any[] {
  return members.filter((m) => {
    if (m.status === "Temporary Discontinue") return false;
    const d = m.daysRemaining;
    if (filter === "all") return d >= 0 && d <= 7;
    if (filter === "0") return d === 0;
    if (filter === "1-2") return d >= 1 && d <= 2;
    if (filter === "3-5") return d >= 3 && d <= 5;
    if (filter === "6-7") return d >= 6 && d <= 7;
    return true;
  });
}

function buildWhatsAppUrl(member: any): string {
  const phone = member.phone.replace(/\D/g, "");
  const dayText =
    member.daysRemaining === 0
      ? "today"
      : `in ${member.daysRemaining} ${member.daysRemaining === 1 ? "day" : "days"}`;
  const message = `Hello ${member.name}, your gym membership will expire ${dayText}. Please renew your membership to continue enjoying our services. Thank you! 🏋️`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function daysBadgeClass(d: number) {
  if (d === 0) return "bg-red-200 text-red-800";
  if (d <= 2) return "bg-red-100 text-red-700";
  if (d <= 5) return "bg-orange-100 text-orange-700";
  return "bg-yellow-100 text-yellow-700";
}

function daysBadgeLabel(d: number) {
  if (d === 0) return "Today";
  return `${d} ${d === 1 ? "day" : "days"}`;
}

// ─── Queue Modal ──────────────────────────────────────────────────
function QueueModal({
  queue,
  currentIndex,
  filterLabel,
  onOpenWhatsApp,
  onNext,
  onSkip,
  onCancel,
  queueState,
}: {
  queue: any[];
  currentIndex: number;
  filterLabel: string;
  onOpenWhatsApp: () => void;
  onNext: () => void;
  onSkip: () => void;
  onCancel: () => void;
  queueState: QueueState;
}) {
  const member = queue[currentIndex];
  const isDone = queueState === "done" || currentIndex >= queue.length;
  const progress = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            <span className="font-bold text-lg">WhatsApp Queue</span>
          </div>
          <button onClick={onCancel} className="p-1 rounded-lg hover:bg-white/20 transition">
            <X size={18} />
          </button>
        </div>

        {/* Filter Badge */}
        <div className="px-6 pt-4 pb-0">
          <div className="flex items-center gap-2 text-xs">
            <Filter size={12} className="text-gray-400" />
            <span className="text-gray-500 font-medium">Active Filter:</span>
            <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full border border-green-200">
              {filterLabel}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
            <span>
              {isDone
                ? `✅ All ${queue.length} reminders sent!`
                : `Sending ${currentIndex + 1} of ${queue.length} reminders`}
            </span>
            <span>{isDone ? 100 : progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${isDone ? 100 : progress}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {isDone ? (
            // Done state
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <p className="text-lg font-bold text-gray-800">All Done!</p>
              <p className="text-sm text-gray-500">
                Successfully queued{" "}
                <span className="font-bold text-green-600">{queue.length}</span>{" "}
                WhatsApp reminders.
              </p>
              <button
                onClick={onCancel}
                className="mt-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-sm"
              >
                Close
              </button>
            </div>
          ) : (
            // Member card
            <div className="space-y-4">
              {/* Member info card */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Member</p>
                    <p className="text-lg font-bold text-gray-800">{member?.name}</p>
                  </div>
                  <span className={`mt-1 px-3 py-1 rounded-full text-xs font-bold ${daysBadgeClass(member?.daysRemaining)}`}>
                    {daysBadgeLabel(member?.daysRemaining)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneCall size={14} className="text-green-500 flex-shrink-0" />
                    <span className="font-medium">{member?.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarDays size={14} className="text-orange-400 flex-shrink-0" />
                    <span className="font-medium">
                      {member?.expiryDate
                        ? format(new Date(member.expiryDate), "MMM dd, yyyy")
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message preview */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-800 font-medium leading-relaxed">
                <p className="text-green-500 text-[10px] font-bold uppercase tracking-wide mb-1">📱 WhatsApp Message Preview</p>
                Hello <strong>{member?.name}</strong>, your gym membership will expire{" "}
                {member?.daysRemaining === 0 ? "today" : `in ${member?.daysRemaining} ${member?.daysRemaining === 1 ? "day" : "days"}`}.
                Please renew your membership to continue enjoying our services. Thank you! 🏋️
              </div>

              {/* Queue up/ahead hints */}
              {currentIndex + 1 < queue.length && (
                <p className="text-xs text-gray-400 text-center">
                  Up next: <span className="font-semibold text-gray-600">{queue[currentIndex + 1]?.name}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!isDone && (
          <div className="px-6 pb-6 grid grid-cols-3 gap-2">
            <button
              onClick={onSkip}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition"
            >
              <SkipForward size={15} />
              Skip
            </button>
            <button
              onClick={onOpenWhatsApp}
              disabled={!member?.phone}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed col-span-1"
            >
              <Send size={14} />
              Open WA
            </button>
            <button
              onClick={onNext}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--foreground)] transition shadow-sm"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMembers: 0, activeMembers: 0, expiredMembers: 0, monthlyRevenue: 0,
  });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringPage, setExpiringPage] = useState(1);
  const [dayFilter, setDayFilter] = useState("all");

  // Queue state
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueState, setQueueState] = useState<QueueState>("idle");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, expiringRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/members/expiring-soon"),
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

  // Derived filtered list
  const filteredExpiring = applyDayFilter(expiringMembers, dayFilter);

  const activeFilterOption = DAY_FILTER_OPTIONS.find((o) => o.value === dayFilter)!;

  const handleDayFilterChange = (val: string) => {
    if (queueState === "running") return; // lock filter during queue
    setDayFilter(val);
    setExpiringPage(1);
  };

  // ── Individual reminder (single row button)
  const sendWhatsAppReminder = (member: any) => {
    if (!member.phone) return;
    window.open(buildWhatsAppUrl(member), "_blank");
  };

  // ── Start queue
  const startQueue = useCallback(() => {
    const members = applyDayFilter(expiringMembers, dayFilter);
    if (members.length === 0) return;
    setQueue(members);
    setQueueIndex(0);
    setQueueState("running");
  }, [expiringMembers, dayFilter]);

  // ── Queue actions
  const handleOpenWhatsApp = () => {
    const member = queue[queueIndex];
    if (member?.phone) window.open(buildWhatsAppUrl(member), "_blank");
  };

  const handleNext = () => {
    if (queueIndex + 1 >= queue.length) {
      setQueueState("done");
    } else {
      setQueueIndex((i) => i + 1);
    }
  };

  const handleSkip = () => {
    if (queueIndex + 1 >= queue.length) {
      setQueueState("done");
    } else {
      setQueueIndex((i) => i + 1);
    }
  };

  const handleCancelQueue = () => {
    setQueueState("idle");
    setQueue([]);
    setQueueIndex(0);
  };

  // Pagination
  const expiringTotalPages = Math.ceil(filteredExpiring.length / PAGE_SIZE);
  const paginatedExpiring = filteredExpiring.slice(
    (expiringPage - 1) * PAGE_SIZE,
    expiringPage * PAGE_SIZE
  );

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Loading dashboard...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Queue Modal */}
      {(queueState === "running" || queueState === "done") && (
        <QueueModal
          queue={queue}
          currentIndex={queueIndex}
          filterLabel={activeFilterOption.label}
          onOpenWhatsApp={handleOpenWhatsApp}
          onNext={handleNext}
          onSkip={handleSkip}
          onCancel={handleCancelQueue}
          queueState={queueState}
        />
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Overview</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-medium text-sm text-[var(--muted-foreground)]">
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members"   value={stats.totalMembers}            icon={Users}      color="bg-blue-100 text-blue-600"                               href="/members?status=All" />
        <StatCard title="Active Members"  value={stats.activeMembers}           icon={Activity}   color="bg-green-100 text-green-600"                             href="/members?status=Active" />
        <StatCard title="Expired Members" value={stats.expiredMembers}          icon={Ban}        color="bg-red-100 text-red-600"                                href="/members?status=Expired" />
        <StatCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`}    icon={CreditCard} color="bg-[var(--accent)] text-[var(--foreground)]" />
      </div>

      {/* Quick Payments table */}
      <div className="pt-2">
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">

          {/* ── Section header ── */}
          <div className="p-6 border-b flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/50">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">
                Quick Action For Late Payments
              </h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1 flex items-center gap-2 flex-wrap">
                Expiring within the next 7 days
                {expiringMembers.length > 0 && (
                  <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {expiringMembers.length} total members
                  </span>
                )}
                {/* Active filter badge */}
                {dayFilter !== "all" && (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${activeFilterOption.color}`}>
                    <Filter size={10} />
                    {activeFilterOption.label} · {filteredExpiring.length} shown
                  </span>
                )}
                {/* Queue running indicator */}
                {queueState === "running" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 animate-pulse">
                    🟢 Queue Running…
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Days filter dropdown — locked during queue */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                <select
                  value={dayFilter}
                  onChange={(e) => handleDayFilterChange(e.target.value)}
                  disabled={queueState === "running"}
                  className="pl-8 pr-4 py-2 text-sm border border-[var(--separator)] rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none bg-white appearance-none cursor-pointer font-medium text-[var(--foreground)] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {DAY_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Send to All → starts queue */}
              <button
                onClick={startQueue}
                disabled={filteredExpiring.length === 0 || queueState === "running"}
                className="flex items-center gap-2 text-sm font-semibold bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition whitespace-nowrap shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare size={15} />
                Send to All
                {filteredExpiring.length > 0 && (
                  <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {filteredExpiring.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">#</th>
                  <th className="p-4 font-bold">Member Name</th>
                  <th className="p-4 font-bold">Phone Number</th>
                  <th className="p-4 font-bold">Days Remaining</th>
                  <th className="p-4 font-bold">Expiry Date</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpiring.map((member: any, idx: number) => {
                  const globalIdx = (expiringPage - 1) * PAGE_SIZE + idx;
                  const isCurrentInQueue = queueState === "running" && queue[queueIndex]?._id === member._id;
                  return (
                    <tr
                      key={member._id}
                      className={`border-b last:border-0 transition-colors ${
                        isCurrentInQueue
                          ? "bg-green-50 ring-2 ring-inset ring-green-400"
                          : member.daysRemaining === 0
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="p-4 text-xs text-gray-400 font-bold">
                        {(expiringPage - 1) * PAGE_SIZE + idx + 1}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-[var(--foreground)] flex items-center gap-2">
                          {isCurrentInQueue && (
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          )}
                          <button
                            onClick={() => router.push(`/payments?memberId=${member._id}&fromDashboard=true`)}
                            className="text-[var(--primary)] hover:underline font-semibold transition-colors hover:text-[var(--foreground)] cursor-pointer"
                            title="Click to record payment for this member"
                          >
                            {member.name}
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-[var(--muted-foreground)]">
                        {member.phone || "N/A"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${daysBadgeClass(member.daysRemaining)}`}>
                          {daysBadgeLabel(member.daysRemaining)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                          <CalendarDays size={14} className={member.daysRemaining <= 2 ? "text-red-400" : "text-orange-400"} />
                          {member.expiryDate ? format(new Date(member.expiryDate), "MMM dd, yyyy") : "N/A"}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          disabled={!member.phone}
                          onClick={() => sendWhatsAppReminder(member)}
                          title={member.phone ? "Send WhatsApp Reminder" : "No phone number available"}
                          className="inline-flex items-center gap-1.5 bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          <MessageSquare size={13} /> Send Reminder
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredExpiring.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center font-medium bg-green-50/50">
                      {expiringMembers.length === 0 ? (
                        <span className="text-green-600">✅ All good! No memberships are expiring within the next 7 days.</span>
                      ) : (
                        <span className="text-gray-500">No members match the selected filter.</span>
                      )}
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

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, color, href }: any) {
  const router = useRouter();
  const isClickable = Boolean(href);
  return (
    <div
      onClick={() => isClickable && router.push(href)}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex items-center justify-between transition-all hover:shadow-md ${
        isClickable ? "cursor-pointer hover:border-[var(--primary)] hover:scale-[1.02] active:scale-[0.99]" : ""
      }`}
      title={isClickable ? `View ${title}` : undefined}
    >
      <div>
        <p className="text-sm font-medium text-[var(--muted-foreground)] mb-1">{title}</p>
        <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
        {isClickable && (
          <p className="text-xs text-[var(--primary)] font-medium mt-1 opacity-0 group-hover:opacity-100">View →</p>
        )}
      </div>
      <div className={`p-4 rounded-full ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  );
}
