"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Users, CreditCard, Activity, Ban, MessageSquare,
  Filter, CalendarDays, ChevronRight, SkipForward,
  X, Send, Loader2, CheckCircle2, PhoneCall, User, Zap
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

type QueueState = "idle" | "running" | "done";

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

function buildWhatsAppUrl(member: any, isExpired: boolean = false): string {
  const phone = (member.phone || "").replace(/\D/g, "");
  let message;
  if (isExpired) {
    const dayText = member.daysExpired === 0 ? "today" : `${member.daysExpired} days ago`;
    message = `Hello ${member.name}, your gym membership expired ${dayText}. Please renew your membership to continue enjoying our services. Thank you! 🏋️`;
  } else {
    const dayText = member.daysRemaining === 0 ? "today" : `in ${member.daysRemaining} days`;
    message = `Hello ${member.name}, your gym membership will expire ${dayText}. Please renew your membership to continue enjoying our services. Thank you! 🏋️`;
  }
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
function QueueModal({ queue, currentIndex, filterLabel, onOpenWhatsApp, onNext, onSkip, onCancel, queueState }: any) {
  const member = queue[currentIndex];
  const isDone = queueState === "done" || currentIndex >= queue.length;
  const progress = Math.round(((currentIndex) / queue.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 bg-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold"><MessageSquare size={20} /> WhatsApp Queue</div>
          <button onClick={onCancel} className="p-1 hover:bg-white/20 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-6">
          {isDone ? (
            <div className="text-center py-6">
              <CheckCircle2 size={48} className="text-green-600 mx-auto mb-4" />
              <p className="text-lg font-bold">All Reminders Sent!</p>
              <button onClick={onCancel} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl font-bold">Close</button>
            </div>
          ) : (
            <div className="space-y-4">
               {/* Progress */}
               <div className="flex justify-between text-xs font-bold text-gray-400 mb-1">
                 <span>Progress: {currentIndex + 1} / {queue.length}</span>
                 <span>{progress}%</span>
               </div>
               <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                 <div className="h-full bg-green-500 transition-all" style={{ width: `${progress}%` }} />
               </div>
               {/* Member Card */}
               <div className="p-4 bg-gray-50 rounded-xl border">
                 <p className="text-lg font-bold">{member.name}</p>
                 <p className="text-sm text-gray-500">{member.phone}</p>
               </div>
               <div className="grid grid-cols-3 gap-2 pt-4">
                 <button onClick={onSkip} className="border py-2.5 rounded-xl text-sm font-bold text-gray-500">Skip</button>
                 <button onClick={onOpenWhatsApp} className="bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold">Open WA</button>
                 <button onClick={onNext} className="bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold">Next</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Photo Viewer Modal ─────────────────────────────────────────────
function PhotoModal({ member, onClose }: { member: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={16} /></div>
            <div>
              <p className="font-bold text-[var(--foreground)] text-sm">{member.name}</p>
              <p className="text-[10px] text-[var(--muted-foreground)] font-medium uppercase tracking-wider">{member.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400"><X size={18} /></button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
          {member.photo ? <img src={member.photo} alt={member.name} className="max-h-80 max-w-full rounded-xl object-contain shadow-lg" /> 
          : <div className="text-center text-gray-300 py-12"><User size={80} strokeWidth={1} /><p className="text-sm font-medium">No photo uploaded</p></div>}
        </div>
        <div className="px-5 py-4 bg-gray-50 border-t flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase">
          <span>Membership Photo</span>
          <span className={`px-2 py-0.5 rounded-full ${daysBadgeClass(member.daysRemaining)}`}>{daysBadgeLabel(member.daysRemaining)} left</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalMembers: 0, activeMembers: 0, expiredMembers: 0, monthlyRevenue: 0 });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [expiredMembersList, setExpiredMembersList] = useState<any[]>([]);
  const [isExpiredView, setIsExpiredView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [dayFilter, setDayFilter] = useState("all");
  const [photoMember, setPhotoMember] = useState<any | null>(null);

  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [queueState, setQueueState] = useState<QueueState>("idle");

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, expiringRes, expiredRes] = await Promise.all([
          api.get("/reports/dashboard"), 
          api.get("/members/expiring-soon"),
          api.get("/members/expired")
        ]);
        setStats(statsRes.data);
        setExpiringMembers(expiringRes.data);
        setExpiredMembersList(expiredRes.data);
      } catch (err) { 
        console.error("Dashboard Fetch Error:", err); 
      } finally { 
        setLoading(false); 
      }
    }
    fetchData();
  }, []);

  const filteredExpiring = applyDayFilter(expiringMembers, dayFilter);
  const currentList = isExpiredView ? expiredMembersList : filteredExpiring;

  const startQueue = useCallback(() => {
    if (currentList.length === 0) return;
    setQueue(currentList);
    setQueueIndex(0);
    setQueueState("running");
  }, [currentList]);

  const handleNext = () => { if (queueIndex + 1 >= queue.length) setQueueState("done"); else setQueueIndex(i => i + 1); };

  if (loading) return <div className="p-8 text-center text-gray-500"><Loader2 size={18} className="animate-spin inline mr-2" /> Loading...</div>;

  const paginatedList = currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {photoMember && <PhotoModal member={photoMember} onClose={() => setPhotoMember(null)} />}
      {(queueState === "running" || queueState === "done") && (
        <QueueModal queue={queue} currentIndex={queueIndex} onNext={handleNext} onSkip={handleNext} onOpenWhatsApp={() => window.open(buildWhatsAppUrl(queue[queueIndex], isExpiredView), "_blank")} onCancel={() => setQueueState("idle")} queueState={queueState} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Overview</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-medium text-sm text-[var(--muted-foreground)] border">{format(new Date(), "MMMM dd, yyyy")}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Members" value={stats.totalMembers} icon={Users} color="bg-blue-100 text-blue-600" href="/members?status=All" />
        <StatCard title="Active Members" value={stats.activeMembers} icon={Activity} color="bg-green-100 text-green-600" href="/members?status=Active" />
        <StatCard title="Expired Members" value={stats.expiredMembers} icon={Ban} color="bg-red-100 text-red-600" href="/members?status=Expired" />
        <StatCard title="Monthly Revenue" value={`₹${stats.monthlyRevenue}`} icon={CreditCard} color="bg-[var(--accent)] text-[var(--foreground)]" />
      </div>

      <div className="pt-2">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Quick Action For Late Payments</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {isExpiredView ? `Expired Members \u2022 ${currentList.length} members shown` : `Expiring within 7 days \u2022 ${currentList.length} members shown`}
                </p>
              </div>
              <div className="bg-gray-100 p-1 rounded-xl flex items-center ml-4">
                <button onClick={() => { setIsExpiredView(false); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${!isExpiredView ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>Expiring Soon</button>
                <button onClick={() => { setIsExpiredView(true); setCurrentPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${isExpiredView ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>Expired</button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isExpiredView && (
                <select value={dayFilter} onChange={(e) => { setDayFilter(e.target.value); setCurrentPage(1); }} className="border px-4 py-2 rounded-xl text-sm bg-white outline-none">
                  {DAY_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              )}
              <button onClick={startQueue} disabled={currentList.length === 0} className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-green-600 transition disabled:opacity-50"><MessageSquare size={16} /> Send to All</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="p-4">#</th>
                  <th className="p-4">Member</th>
                  <th className="p-4">Phone</th>
                  {isExpiredView && <th className="p-4">Join Date</th>}
                  <th className="p-4">{isExpiredView ? "Expiry Date" : "Remaining"}</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedList.map((m: any, idx: number) => (
                  <tr key={m._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-[10px] text-gray-300 font-bold">{(currentPage - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="p-4">
                      <button onClick={() => setPhotoMember(m)} className="flex items-center gap-3 text-left group">
                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0 bg-gray-100 group-hover:border-blue-200 transition-all">
                          {m.photo ? <img src={m.photo} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                        </div>
                        <div><div className="font-bold text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{m.name}</div><div className="text-[10px] text-gray-400 font-mono italic">View Profile Photo</div></div>
                      </button>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{m.phone}</td>
                    {isExpiredView && (
                      <td className="p-4 text-sm text-gray-500 font-medium">{format(new Date(m.joinDate), "MMM dd, yyyy")}</td>
                    )}
                    <td className="p-4">
                      {isExpiredView ? (
                        <div className="flex flex-col gap-1">
                           <span className="text-sm font-semibold text-gray-700">{format(new Date(m.expiryDate), "MMM dd, yyyy")}</span>
                           <span className="text-[10px] font-bold text-red-600 bg-red-50 inline-block px-2 py-0.5 rounded-full w-fit">{m.daysExpired} days ago</span>
                        </div>
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${daysBadgeClass(m.daysRemaining)}`}>{daysBadgeLabel(m.daysRemaining)}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => router.push(`/payments?memberId=${m._id}&fromDashboard=true`)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-blue-100 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"><CreditCard size={12} /> Payment</button>
                        <button onClick={() => window.open(buildWhatsAppUrl(m, isExpiredView), "_blank")} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-green-100 hover:bg-green-600 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"><MessageSquare size={12} /> Reminder</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={currentPage} totalPages={Math.ceil(currentList.length / PAGE_SIZE)} onPageChange={setCurrentPage} totalItems={currentList.length} itemsPerPage={PAGE_SIZE} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, href }: any) {
  const router = useRouter();
  const isClickable = Boolean(href);
  return (
    <div onClick={() => isClickable && router.push(href)} className={`bg-white p-6 rounded-2xl shadow-sm border flex items-center justify-between transition-all hover:shadow-md ${isClickable ? "cursor-pointer hover:border-blue-500 hover:scale-[1.02]" : ""}`}>
      <div><p className="text-xs font-bold text-gray-400 uppercase mb-1 tracking-widest">{title}</p><p className="text-3xl font-bold text-gray-800 tracking-tight">{value}</p></div>
      <div className={`p-4 rounded-2xl ${color} shadow-sm`}><Icon size={24} /></div>
    </div>
  );
}
