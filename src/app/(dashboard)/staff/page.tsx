"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Edit2, Trash2, Users } from "lucide-react";

export default function StaffPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState({ id: "", name: "", phone: "", address: "" });
  
  // Mapping View
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [assignedMembers, setAssignedMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/staff");
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      if (currentStaff.id) {
        await api.put(`/staff/${currentStaff.id}`, currentStaff);
      } else {
        await api.post("/staff", currentStaff);
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const openEdit = (staff: any) => {
    setCurrentStaff({
      id: staff._id,
      name: staff.name,
      phone: staff.phone,
      address: staff.address
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      try {
        await api.delete(`/staff/${id}`);
        fetchStaff();
      } catch (err: any) {
        alert(err.response?.data?.message || err.message);
      }
    }
  };

  const handleTrainerChange = async (e: any) => {
    const trainerId = e.target.value;
    setSelectedTrainerId(trainerId);
    if (!trainerId) {
      setAssignedMembers([]);
      return;
    }
    
    setLoadingMembers(true);
    try {
      const { data } = await api.get(`/staff/${trainerId}/members`);
      setAssignedMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  if (loading) return <div className="p-8">Loading staff...</div>;

  return (
    <div className="space-y-8">
      {/* SECTION 1: STAFF LIST */}
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Gym Staff</h1>
            <p className="text-[var(--muted-foreground)] text-sm">Manage trainers and employees</p>
          </div>
          <button 
            onClick={() => { setCurrentStaff({ id: "", name: "", phone: "", address: "" }); setIsModalOpen(true); }}
            className="flex flex-shrink-0 items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md w-full md:w-auto justify-center"
          >
            <Plus size={16} /> Add Staff
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Staff Name</th>
                  <th className="p-4 font-bold">Phone Number</th>
                  <th className="p-4 font-bold">Address</th>
                  <th className="p-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff: any) => (
                  <tr key={staff._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-[var(--foreground)]">{staff.name}</td>
                    <td className="p-4 text-sm font-medium">{staff.phone}</td>
                    <td className="p-4 text-sm text-[var(--muted-foreground)]">{staff.address}</td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(staff)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(staff._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--muted-foreground)] font-medium bg-gray-50">
                      No staff members added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRAINER -> MEMBERS MAPPING */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b">
          <div className="bg-blue-50 p-3 rounded-full text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Trainer Assignments</h2>
            <p className="text-sm text-[var(--muted-foreground)]">View members assigned to specific trainers</p>
          </div>
        </div>
        
        <div className="max-w-md mb-6">
          <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Select Personal Trainer</label>
          <select 
            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white"
            value={selectedTrainerId}
            onChange={handleTrainerChange}
          >
            <option value="">-- Choose a Trainer --</option>
            {staffList.map((staff: any) => (
              <option key={staff._id} value={staff._id}>{staff.name}</option>
            ))}
          </select>
        </div>

        {selectedTrainerId && (
          <div className="overflow-x-auto border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Member Name</th>
                  <th className="p-4 font-bold">Phone Number</th>
                  <th className="p-4 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingMembers ? (
                  <tr><td colSpan={3} className="p-6 text-center text-gray-400 font-medium">Loading members...</td></tr>
                ) : assignedMembers.length > 0 ? (
                  assignedMembers.map(member => (
                    <tr key={member._id} className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="p-4 font-semibold">{member.name}</td>
                      <td className="p-4 text-sm font-medium">{member.phone}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-gray-400 font-medium">
                      No members assigned to this trainer yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md my-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 border-b pb-4">{currentStaff.id ? "Edit Staff" : "Add New Staff"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Full Name</label>
                <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentStaff.name} onChange={e => setCurrentStaff({...currentStaff, name: e.target.value})} placeholder="Jane Doe" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Phone Number</label>
                <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentStaff.phone} onChange={e => setCurrentStaff({...currentStaff, phone: e.target.value})} placeholder="+1 (555) 000-0000" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Address</label>
                <textarea rows={2} required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm resize-none" value={currentStaff.address} onChange={e => setCurrentStaff({...currentStaff, address: e.target.value})} placeholder="123 Main St..." />
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 font-bold text-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[var(--primary)] text-white px-4 py-3 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all">Save Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
