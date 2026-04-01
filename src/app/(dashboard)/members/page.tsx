"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Edit2, Trash2, Search, Filter } from "lucide-react";
import { format } from "date-fns";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const [currentMember, setCurrentMember] = useState({
    id: "", name: "", phone: "", address: "", membershipPlan: "", expiryDate: "", status: "Active", personalTraining: "No", personalTrainerId: ""
  });

  const fetchData = async () => {
    try {
      const [membersRes, plansRes, staffRes] = await Promise.all([
        api.get("/members"),
        api.get("/plans"),
        api.get("/staff")
      ]);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentMember,
        personalTraining: currentMember.personalTraining === "Yes"
      };
      if (currentMember.id) {
        await api.put(`/members/${currentMember.id}`, payload);
      } else {
        await api.post("/members", payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (member: any) => {
    setCurrentMember({
      id: member._id,
      name: member.name,
      phone: member.phone,
      address: member.address,
      membershipPlan: member.membershipPlan?._id || "",
      expiryDate: member.expiryDate ? format(new Date(member.expiryDate), "yyyy-MM-dd") : "",
      status: member.status,
      personalTraining: member.personalTraining ? "Yes" : "No",
      personalTrainerId: member.personalTrainerId?._id || member.personalTrainerId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await api.delete(`/members/${id}`);
      fetchData();
    }
  };

  const filteredMembers = members.filter((member: any) => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          member.phone.includes(searchTerm);
    const matchesStatus = filterStatus === "All" || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8">Loading members...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Members Directory</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{filteredMembers.length} Total Members</p>
        </div>
        <button 
          onClick={() => { setCurrentMember({ id: "", name: "", phone: "", address: "", membershipPlan: plans[0]?._id || "", expiryDate: "", status: "Active", personalTraining: "No", personalTrainerId: "" }); setIsModalOpen(true); }}
          className="flex flex-shrink-0 items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Register Member
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none appearance-none bg-white transition-all cursor-pointer"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Temporary Discontinue">Temporary Discontinue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Name</th>
                <th className="p-4 font-bold">Contact</th>
                <th className="p-4 font-bold">Plan</th>
                <th className="p-4 font-bold">Trainer</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Expiry</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member: any) => (
                <tr key={member._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-[var(--foreground)]">{member.name}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">ID: {member._id.substr(member._id.length - 6).toUpperCase()}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{member.phone}</div>
                    <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px]">{member.address}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold">{member.membershipPlan?.name || "N/A"}</div>
                    <div className="text-xs text-[var(--primary)] font-medium">${member.membershipPlan?.price}</div>
                  </td>
                  <td className="p-4">
                    {member.personalTraining ? (
                      <div className="text-sm font-medium text-blue-600">{member.personalTrainerId?.name || "Unassigned"}</div>
                    ) : (
                      <div className="text-sm text-gray-400">No Personal Trainer</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${member.status === 'Active' ? 'bg-green-100 text-green-700' : member.status === 'Temporary Discontinue' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-[var(--muted-foreground)]">
                    {member.expiryDate ? format(new Date(member.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(member)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(member._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[var(--muted-foreground)] font-medium bg-gray-50">
                    No members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-xl my-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 border-b pb-4">{currentMember.id ? "Edit Member Details" : "Register New Member"}</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Full Name</label>
                  <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.name} onChange={e => setCurrentMember({...currentMember, name: e.target.value})} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Phone Number</label>
                  <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.phone} onChange={e => setCurrentMember({...currentMember, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Address</label>
                <textarea rows={2} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm resize-none" value={currentMember.address} onChange={e => setCurrentMember({...currentMember, address: e.target.value})} placeholder="123 Main St..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Membership Plan</label>
                  <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.membershipPlan} onChange={e => setCurrentMember({...currentMember, membershipPlan: e.target.value})}>
                    <option value="" disabled>Select a plan</option>
                    {plans.map((p: any) => <option key={p._id} value={p._id}>{p.name} - ${p.price}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Status</label>
                  <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.status} onChange={e => setCurrentMember({...currentMember, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Temporary Discontinue">Temporary Discontinue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Personal Training</label>
                  <select className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.personalTraining} onChange={e => setCurrentMember({...currentMember, personalTraining: e.target.value, personalTrainerId: e.target.value === 'No' ? '' : currentMember.personalTrainerId})}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {currentMember.personalTraining === 'Yes' && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Select Personal Trainer</label>
                    <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.personalTrainerId} onChange={e => setCurrentMember({...currentMember, personalTrainerId: e.target.value})}>
                      <option value="" disabled>Select a trainer</option>
                      {staff.map((s: any) => <option key={s._id} value={s._id}>{s.name} - {s.phone}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Expiry Date</label>
                <input required type="date" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.expiryDate} onChange={e => setCurrentMember({...currentMember, expiryDate: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 font-bold text-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[var(--primary)] text-white px-4 py-3 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
