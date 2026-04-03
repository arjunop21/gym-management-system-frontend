"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CheckCircle2, UserCheck } from "lucide-react";
import { format } from "date-fns";

export default function AttendancePage() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [status, setStatus] = useState("Present");
  const [filterDate, setFilterDate] = useState("");

  const fetchData = async () => {
    try {
      const [attendanceRes, membersRes] = await Promise.all([
        api.get("/attendance"),
        api.get("/members")
      ]);
      setAttendanceLogs(attendanceRes.data.filter((log: any) => log.memberId?.personalTraining));
      setMembers(membersRes.data.filter((m: any) => m.status === 'Active' && m.personalTraining)); // Only active members with PT
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAttendance = async (e: any) => {
    e.preventDefault();
    if (!selectedMember) return alert("Please select a member");
    try {
      await api.post("/attendance", { memberId: selectedMember, status });
      setSelectedMember("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading attendance records...</div>;

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Marking Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] h-fit">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-[var(--foreground)] border-b pb-4">
            <UserCheck className="text-[var(--primary)]" /> Mark Attendance
          </h2>
          
          <form onSubmit={handleMarkAttendance} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Select Member</label>
              <select 
                required 
                className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" 
                value={selectedMember} 
                onChange={e => setSelectedMember(e.target.value)}
              >
                <option value="" disabled>Search or select member...</option>
                {members.map((m: any) => <option key={m._id} value={m._id}>{m.name} - {m.phone}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Status</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${status === 'Present' ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)] font-bold' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="status" value="Present" checked={status === 'Present'} onChange={() => setStatus('Present')} className="hidden" />
                  <CheckCircle2 size={18} /> Present
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${status === 'Absent' ? 'border-red-500 bg-red-50 text-red-700 font-bold' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}>
                  <input type="radio" name="status" value="Absent" checked={status === 'Absent'} onChange={() => setStatus('Absent')} className="hidden" />
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current"></div></div> Absent
                </label>
              </div>
            </div>

            <button type="submit" className="w-full bg-[var(--primary)] text-white px-4 py-3.5 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all mt-6">
              Save Attendance
            </button>
          </form>
        </div>

        {/* Recent Attendance Logs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden flex flex-col">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-[var(--foreground)]">Recent Logs</h2>
            <input 
              type="date" 
              className="border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none shadow-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto flex-1 h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-[var(--muted)] z-10">
                <tr className="border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Member</th>
                  <th className="p-4 font-bold">Trainer Name</th>
                  <th className="p-4 font-bold">Date & Time</th>
                  <th className="p-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceLogs
                  .filter((log: any) => !filterDate || format(new Date(log.date), 'yyyy-MM-dd') === filterDate)
                  .slice().reverse().map((log: any) => (
                  <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-[var(--foreground)]">{log.memberId?.name || "Unknown"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-blue-600">{log.memberId?.personalTrainerId?.name || "Unassigned"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-[var(--muted-foreground)]">
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                        <span className="block text-xs opacity-70">{format(new Date(log.date), 'hh:mm a')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${log.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendanceLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--muted-foreground)] font-medium">
                      No attendance records found yet.
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
