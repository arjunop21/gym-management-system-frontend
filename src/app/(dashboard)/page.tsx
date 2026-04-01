"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Users, CreditCard, Activity, Ban, MessageSquare } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    monthlyRevenue: 0,
  });
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    const phone = member.phone.replace(/\D/g, ''); // Removes spaces, +, etc.
    const message = `Hello ${member.name}, your gym membership will expire in ${member.daysRemaining} days. Please renew your membership to continue enjoying our services.`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

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
        <StatCard title="Monthly Revenue" value={`$${stats.monthlyRevenue}`} icon={CreditCard} color="bg-[var(--accent)] text-[var(--foreground)]" />
      </div>

      <div className="pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Quick Action For Late Payments</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">Expiring within the next 7 days</p>
            </div>
            {expiringMembers.length > 0 && (
              <button 
                onClick={() => expiringMembers.forEach(m => sendWhatsAppReminder(m))}
                className="text-sm font-semibold bg-green-100 text-green-700 px-4 py-2 rounded-xl hover:bg-green-200 transition"
              >
                Send to All
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white shadow-sm">
                <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Member Name</th>
                  <th className="p-4 font-bold">Phone Number</th>
                  <th className="p-4 font-bold">Days Remaining</th>
                  <th className="p-4 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {expiringMembers.map((member: any) => (
                  <tr key={member._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-[var(--foreground)]">{member.name}</td>
                    <td className="p-4 text-sm font-medium text-[var(--muted-foreground)]">{member.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${member.daysRemaining <= 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {member.daysRemaining} {member.daysRemaining === 1 ? 'day' : 'days'}
                      </span>
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
                {expiringMembers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-green-600 font-medium bg-green-50/50">
                      All good! No memberships are expiring within the next 7 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
