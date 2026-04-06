"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  Plus, Edit2, Trash2, Search, Filter, CalendarDays,
  Camera, Upload, X, ImageIcon, Loader2, User, FileText, Zap
} from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

const PAGE_SIZE = 5;
const MAX_FILE_MB = 5;
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"
];

// ── Photo Viewer Modal ─────────────────────────────────────────────
function PhotoModal({ member, onClose }: { member: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div><p className="font-bold">{member.name}</p></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[260px]">
          {member.photo ? <img src={member.photo} alt={member.name} className="max-h-72 object-contain" /> : <User size={72} className="text-gray-200" />}
        </div>
      </div>
    </div>
  );
}

// ── Image Upload Field ──────────────────────────────────────────────
function ImageUploadField({ photoUrl, onPhotoUploaded }: { photoUrl: string; onPhotoUploaded: (url: string) => void; }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(photoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    if (!ALLOWED_TYPES.includes(file.type)) return setError("Invalid file type.");
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError("File too large.");

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await api.post("/upload/member-image", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onPhotoUploaded(res.data.url);
    } catch (err: any) {
      setError("Upload failed.");
      setPreview(photoUrl);
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-bold text-gray-500">Member Photo</label>
      {preview ? (
        <div className="relative w-28 h-28 border rounded-xl overflow-hidden group">
          <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin" /></div>}
          <button type="button" onClick={() => { setPreview(""); onPhotoUploaded(""); }} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={14} /></button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition"><Upload size={14} /> Upload</button>
          <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition"><Camera size={14} /> Camera</button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main Content ───────────────────────────────────────────────────
function MembersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [membersPage, setMembersPage] = useState(1);
  const [photoMember, setPhotoMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberIdToDelete, setMemberIdToDelete] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const blankMember = {
    id: "", name: "", phone: "", address: "",
    membershipPlan: "", joinDate: today,
    status: "Active", personalTraining: "No", personalTrainerId: "",
    photo: "",
  };
  const [currentMember, setCurrentMember] = useState(blankMember);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) setFilterStatus(status);
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [membersRes, plansRes, staffRes] = await Promise.all([
        api.get("/members"), api.get("/plans"), api.get("/staff")
      ]);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
      setStaff(staffRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const getExpiryPreview = () => {
    if (!currentMember.membershipPlan || !currentMember.joinDate) return null;
    const plan = plans.find((p: any) => p._id === currentMember.membershipPlan);
    if (!plan) return null;
    const expiry = new Date(currentMember.joinDate);
    expiry.setMonth(expiry.getMonth() + plan.duration);
    return expiry;
  };
  const expiryPreview = getExpiryPreview();

  const handleSave = async (e: any) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload: any = {
        name: currentMember.name,
        phone: currentMember.phone,
        address: currentMember.address,
        photo: currentMember.photo,
        membershipPlan: currentMember.membershipPlan,
        joinDate: currentMember.joinDate,
        status: currentMember.status,
        personalTraining: currentMember.personalTraining === "Yes",
        personalTrainerId: currentMember.personalTrainerId || null,
      };

      if (currentMember.id) {
        await api.put(`/members/${currentMember.id}`, payload);
        setIsModalOpen(false);
        fetchData();
      } else {
        const res = await api.post("/members", payload);
        setIsModalOpen(false);
        fetchData();
        router.push(`/payments?memberId=${res.data._id}&fromDashboard=true`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save member.");
    } finally { setSaving(false); }
  };

  const openEdit = (m: any) => {
    setCurrentMember({
      id: m._id, name: m.name, phone: m.phone, address: m.address,
      membershipPlan: m.membershipPlan?._id || m.membershipPlan || "",
      joinDate: m.joinDate ? format(new Date(m.joinDate), "yyyy-MM-dd") : today,
      status: m.status, personalTraining: m.personalTraining ? "Yes" : "No",
      personalTrainerId: m.personalTrainerId?._id || m.personalTrainerId || "",
      photo: m.photo || ""
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!memberIdToDelete) return;
    try {
      setSaving(true);
      await api.delete(`/members/${memberIdToDelete}`);
      setIsDeleteModalOpen(false);
      setMemberIdToDelete(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setMemberIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const filteredMembers = members.map(m => {
    let dStatus = m.status;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (m.status === "Active" && m.expiryDate && new Date(m.expiryDate) < now) dStatus = "Expired";
    return { ...m, dStatus };
  }).filter(m => {
    const s = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm);
    const st = filterStatus === "All" || m.dStatus === filterStatus;
    return s && st;
  });

  const pMembers = filteredMembers.slice((membersPage - 1) * PAGE_SIZE, membersPage * PAGE_SIZE);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {photoMember && <PhotoModal member={photoMember} onClose={() => setPhotoMember(null)} />}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Members Directory</h1></div>
        <button onClick={() => { setCurrentMember({ ...blankMember, membershipPlan: plans[0]?._id }); setError(""); setIsModalOpen(true); }} className="bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl font-medium">+ Register Member</button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 border rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <select className="border px-4 py-2 rounded-xl bg-white" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Temporary Discontinue">Temporary Discontinue</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[800px]">
          <thead className="bg-gray-50 text-xs font-bold text-gray-400 uppercase">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Trainer</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Join Date</th>
              <th className="p-4 text-center">Expiry</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pMembers.map((m: any) => (
              <tr key={m._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">
                  <button onClick={() => setPhotoMember(m)} className="flex items-center gap-2 text-left">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {m.photo ? <img src={m.photo} alt={m.name} className="w-full h-full object-cover" /> : <User size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-700">{m.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">ID: {m._id.slice(-6).toUpperCase()}</div>
                    </div>
                  </button>
                </td>
                <td className="p-4">
                  <div className="text-xs font-bold text-gray-700">{m.membershipPlan?.name || "N/A"}</div>
                  <div className="text-[10px] text-[var(--primary)] font-bold">₹{m.membershipPlan?.price}</div>
                </td>
                <td className="p-4">
                  {m.personalTraining ? (
                    <div className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Zap size={10} fill="currentColor" />
                      {staff.find((s: any) => s._id === (m.personalTrainerId?._id || m.personalTrainerId))?.name || "Unassigned"}
                    </div>
                  ) : <div className="text-xs text-gray-300">No PT</div>}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${m.dStatus === "Active" ? "bg-green-100 text-green-700" : m.dStatus === "Temporary Discontinue" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>
                    {m.dStatus}
                  </span>
                </td>
                <td className="p-4 text-center text-xs text-gray-500 font-medium">{m.joinDate ? format(new Date(m.joinDate), "dd MMM yyyy") : "-"}</td>
                <td className="p-4 text-center text-xs text-gray-500 font-medium">{m.expiryDate ? format(new Date(m.expiryDate), "dd MMM yyyy") : "-"}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(m)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => openDeleteModal(m._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <Pagination currentPage={membersPage} totalPages={Math.ceil(filteredMembers.length/PAGE_SIZE)} onPageChange={setMembersPage} totalItems={filteredMembers.length} itemsPerPage={PAGE_SIZE} />
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDelete} 
        title="Delete Member" 
        message="Are you sure you want to delete this member? This action cannot be undone and all their records will be removed."
        loading={saving}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 pt-10">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentMember.id ? "Edit Member" : "Register Member"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold">{error}</div>}

            <form onSubmit={handleSave} className="space-y-4">
              <ImageUploadField photoUrl={currentMember.photo} onPhotoUploaded={(url) => setCurrentMember({ ...currentMember, photo: url })} />
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50/50 p-4 rounded-2xl border space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Information</p>
                  <div><label className="text-xs font-bold text-gray-500 block mb-1">Full Name</label><input required className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none" value={currentMember.name} onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })} placeholder="John Doe" /></div>
                  <div><label className="text-xs font-bold text-gray-500 block mb-1">Phone Number</label><input required className="w-full border p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-[var(--primary)] outline-none" value={currentMember.phone} onChange={e => setCurrentMember({ ...currentMember, phone: e.target.value })} placeholder="+91 99999 99999" /></div>
                  <div><label className="text-xs font-bold text-gray-500 block mb-1">Address</label><textarea required rows={2} className="w-full border p-2.5 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[var(--primary)] outline-none" value={currentMember.address} onChange={e => setCurrentMember({ ...currentMember, address: e.target.value })} placeholder="Street address..." /></div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Membership & Dates</p>
                  <div><label className="text-xs font-bold text-gray-500 block mb-1">Select Plan</label>
                    <select required className="w-full border p-2.5 rounded-xl text-sm bg-white" value={currentMember.membershipPlan} onChange={e => setCurrentMember({ ...currentMember, membershipPlan: e.target.value })}>
                      <option value="" disabled>Choose a plan</option>
                      {plans.map((p: any) => <option key={p._id} value={p._id}>{p.name} — ₹{p.price}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Join Date</label><input required type="date" className="w-full border p-2.5 rounded-xl text-sm" value={currentMember.joinDate} onChange={e => setCurrentMember({ ...currentMember, joinDate: e.target.value })} /></div>
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Expiry (Auto)</label><div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl text-xs font-bold text-blue-700 flex items-center gap-1"><CalendarDays size={12} /> {expiryPreview ? format(expiryPreview, "dd MMM yyyy") : "Select plan"}</div></div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-4 rounded-2xl border space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Personal Training</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">Need PT?</span>
                      <select className="border text-xs font-bold p-1 rounded-lg bg-white" value={currentMember.personalTraining} onChange={e => setCurrentMember({ ...currentMember, personalTraining: e.target.value, personalTrainerId: e.target.value === "No" ? "" : currentMember.personalTrainerId })}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  {currentMember.personalTraining === "Yes" && (
                    <div><label className="text-xs font-bold text-gray-500 block mb-1">Assign Personal Trainer</label>
                      <select required className="w-full border p-2.5 rounded-xl text-sm bg-white" value={currentMember.personalTrainerId} onChange={e => setCurrentMember({ ...currentMember, personalTrainerId: e.target.value })}>
                        <option value="" disabled>Select a staff member</option>
                        {staff.map((s: any) => <option key={s._id} value={s._id}>{s.name} — {s.phone}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border rounded-xl font-bold text-gray-400 hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition">{saving ? "Saving..." : "Save Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MembersPage() {
  return <Suspense fallback={<div>Loading...</div>}><MembersContent /></Suspense>;
}
