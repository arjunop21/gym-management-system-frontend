"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { CheckCircle2, UserCheck, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

const PAGE_SIZE = 5;

export default function AttendancePage() {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [members, setMembers]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [status, setStatus]                 = useState("Present");
  const [filterDate, setFilterDate]         = useState("");
  const [logsPage, setLogsPage] = useState(1);

  // Search & Autocomplete state
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [logIdToDelete, setLogIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [attendanceRes, membersRes] = await Promise.all([
        api.get("/attendance"),
        api.get("/members"),
      ]);
      setAttendanceLogs(attendanceRes.data.filter((log: any) => log.memberId?.personalTraining));
      setMembers(membersRes.data.filter((m: any) => m.status === "Active" && m.personalTraining));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkAttendance = async (e: any) => {
    e.preventDefault();
    if (!selectedMember) return alert("Please select a member");
    try {
      await api.post("/attendance", { memberId: selectedMember, status });
      setSelectedMember("");
      setMemberSearch("");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLog = async () => {
    if (!logIdToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/attendance/${logIdToDelete}`);
      setIsDeleteModalOpen(false);
      setLogIdToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setLogIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Filter members for autocomplete
  const filteredMembersResults = members.filter((m: any) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  ).slice(0, 5);

  const selectMember = (m: any) => {
    setSelectedMember(m._id);
    setMemberSearch(m.name);
    setShowMemberDropdown(false);
  };

  if (loading) return <div className="p-8">Loading attendance records...</div>;

  // Filter logs by date, then reverse (newest first)
  const filteredLogs = attendanceLogs
    .filter((log: any) => !filterDate || format(new Date(log.date), "yyyy-MM-dd") === filterDate)
    .slice()
    .reverse();

  // Reset to page 1 when date filter changes — handled via derived value
  const logsTotalPages  = Math.ceil(filteredLogs.length / PAGE_SIZE);
  const paginatedLogs   = filteredLogs.slice(
    (logsPage - 1) * PAGE_SIZE,
    logsPage * PAGE_SIZE
  );

  const handleDateChange = (val: string) => {
    setFilterDate(val);
    setLogsPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Mark Attendance Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] h-fit">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-[var(--foreground)] border-b pb-4">
            <UserCheck className="text-[var(--primary)]" /> Mark Attendance
          </h2>

          <form onSubmit={handleMarkAttendance} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Select Member</label>
              <div className="relative">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    className="w-full border pl-9 p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white"
                    placeholder="Search name or phone..."
                    value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                    onFocus={() => setShowMemberDropdown(true)}
                  />
                </div>
                {showMemberDropdown && memberSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                    {filteredMembersResults.length > 0 ? (
                      filteredMembersResults.map((m: any) => (
                        <button
                          key={m._id}
                          type="button"
                          onClick={() => selectMember(m)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0 transition-colors"
                        >
                          <div className="font-bold text-sm text-[var(--foreground)]">{m.name}</div>
                          <div className="text-[10px] text-gray-400 font-medium">{m.phone}</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-400 text-sm italic py-6">No matching members found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Status</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${status === "Present" ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)] font-bold shadow-sm" : "border-gray-50 text-gray-400 hover:bg-gray-50 bg-gray-50/50"}`}>
                  <input type="radio" name="status" value="Present" checked={status === "Present"} onChange={() => setStatus("Present")} className="hidden" />
                  <CheckCircle2 size={18} /> Present
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${status === "Absent" ? "border-red-500 bg-red-50 text-red-700 font-bold shadow-sm" : "border-gray-50 text-gray-400 hover:bg-gray-50 bg-gray-50/50"}`}>
                  <input type="radio" name="status" value="Absent" checked={status === "Absent"} onChange={() => setStatus("Absent")} className="hidden" />
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-current" />
                  </div>
                  Absent
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedMember}
              className="w-full bg-[var(--primary)] text-white px-4 py-3.5 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              Save Attendance record
            </button>
          </form>
        </div>

        {/* Attendance Logs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden flex flex-col">
          {/* Log header */}
          <div className="p-6 border-b flex justify-between items-center bg-gray-50/30">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Recent Logs</h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 font-medium">
                {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""}
                {filterDate && ` on ${format(new Date(filterDate + "T00:00:00"), "MMM dd, yyyy")}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                className="border p-2 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] focus:outline-none shadow-sm outline-none"
                value={filterDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {filterDate && (
                <button
                  onClick={() => handleDateChange("")}
                  className="text-xs text-gray-500 hover:text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-50 z-10 border-b">
                <tr className="text-[var(--muted-foreground)] text-[10px] uppercase font-bold tracking-widest leading-none">
                  <th className="p-4">#</th>
                  <th className="p-4">Member</th>
                  <th className="p-4">Trainer Name</th>
                  <th className="p-4">Date &amp; Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.map((log: any, idx: number) => (
                  <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-[10px] text-gray-300 font-bold">
                      {(logsPage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-[var(--foreground)] text-sm">{log.memberId?.name || "Unknown"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">{log.memberId?.personalTrainerId?.name || "Unassigned"}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-[var(--muted-foreground)]">
                        {format(new Date(log.date), "MMM dd, yyyy")}
                        <span className="block text-[10px] opacity-70 font-bold mt-0.5">{format(new Date(log.date), "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${log.status === "Present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => openDeleteModal(log._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors group">
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-[var(--muted-foreground)] font-medium bg-gray-50/50">
                      {filterDate ? "No records found for the selected date." : "No attendance records found yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={logsPage}
            totalPages={logsTotalPages}
            onPageChange={(p) => setLogsPage(p)}
            totalItems={filteredLogs.length}
            itemsPerPage={PAGE_SIZE}
          />
        </div>
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeleteLog} 
        title="Delete Record" 
        message="Are you sure you want to delete this attendance log? This action is permanent and will remove the record from the history."
        loading={isDeleting}
      />
    </div>
  );
}
