"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import {
  Plus, Edit2, Trash2, Search, Filter, CalendarDays,
  Camera, Upload, X, ImageIcon, Loader2, User
} from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";
import Image from "next/image";

const PAGE_SIZE = 5;
const MAX_FILE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ── Photo Viewer Modal ─────────────────────────────────────────────
function PhotoModal({ member, onClose }: { member: any; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-bold text-[var(--foreground)]">{member.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{member.phone}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>
        <div className="p-4 flex items-center justify-center bg-gray-50 min-h-[260px]">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="max-h-72 max-w-full rounded-xl object-contain shadow"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-gray-300">
              <User size={72} strokeWidth={1} />
              <p className="text-sm text-gray-400 font-medium">No photo uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Image Upload Field ──────────────────────────────────────────────
function ImageUploadField({
  photoUrl,
  onPhotoUploaded,
}: {
  photoUrl: string;
  onPhotoUploaded: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]     = useState<string>(photoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFile = async (file: File) => {
    setUploadError("");

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError("Invalid file type. Use JPEG, PNG, WEBP, or GIF.");
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setUploadError(`File too large. Maximum size is ${MAX_FILE_MB} MB.`);
      return;
    }

    // Local preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to backend → Firebase
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await api.post("/upload/member-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onPhotoUploaded(res.data.url);
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || "Upload failed. Try again.");
      setPreview(photoUrl); // revert preview
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearPhoto = () => {
    setPreview("");
    onPhotoUploaded("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-2">
        Member Photo
        <span className="ml-1 text-xs font-normal text-gray-400">(JPEG / PNG / WEBP · max 5 MB)</span>
      </label>

      {preview ? (
        // Preview card
        <div className="relative flex flex-col items-center gap-3 p-4 border rounded-xl bg-gray-50">
          <img
            src={preview}
            alt="Preview"
            className="w-28 h-28 rounded-xl object-cover shadow border"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
              <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
            </div>
          )}
          {!uploading && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs font-semibold bg-[var(--primary)] text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
              >
                <Upload size={13} /> Change
              </button>
              <button
                type="button"
                onClick={clearPhoto}
                className="flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition"
              >
                <X size={13} /> Remove
              </button>
            </div>
          )}
        </div>
      ) : (
        // Drop zone
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-[var(--primary)] hover:bg-gray-50 transition group"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 size={28} className="animate-spin text-[var(--primary)]" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[var(--primary)]/10 flex items-center justify-center transition">
              <ImageIcon size={22} className="text-gray-400 group-hover:text-[var(--primary)] transition" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-600">
              {uploading ? "Uploading…" : "Drop image here or click to browse"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Also supports camera capture on mobile</p>
          </div>
          <div className="flex gap-2">
            <span className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-600">
              <Upload size={11} /> File upload
            </span>
            <span className="flex items-center gap-1 text-xs bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-600">
              <Camera size={11} /> Camera (mobile)
            </span>
          </div>
        </div>
      )}

      {/* Hidden input — supports both file and camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />

      {uploadError && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{uploadError}</p>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers]           = useState<any[]>([]);
  const [plans, setPlans]               = useState<any[]>([]);
  const [staff, setStaff]               = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [membersPage, setMembersPage]   = useState(1);
  const [photoMember, setPhotoMember]   = useState<any | null>(null); // for photo viewer

  const today = format(new Date(), "yyyy-MM-dd");

  const blankMember = {
    id: "", name: "", phone: "", address: "",
    membershipPlan: "", joinDate: today,
    status: "Active", personalTraining: "No", personalTrainerId: "",
    photo: "",
  };

  const [currentMember, setCurrentMember] = useState(blankMember);

  // Expiry preview
  const getExpiryPreview = () => {
    if (!currentMember.membershipPlan || !currentMember.joinDate) return null;
    const plan = plans.find((p: any) => p._id === currentMember.membershipPlan);
    if (!plan) return null;
    const expiry = new Date(currentMember.joinDate);
    expiry.setMonth(expiry.getMonth() + plan.duration);
    return expiry;
  };
  const expiryPreview = getExpiryPreview();

  const fetchData = async () => {
    try {
      const [membersRes, plansRes, staffRes] = await Promise.all([
        api.get("/members"),
        api.get("/plans"),
        api.get("/staff"),
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

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        ...currentMember,
        personalTraining: currentMember.personalTraining === "Yes",
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

  const openAdd = () => {
    setCurrentMember({ ...blankMember, membershipPlan: plans[0]?._id || "" });
    setIsModalOpen(true);
  };

  const openEdit = (member: any) => {
    setCurrentMember({
      id: member._id,
      name: member.name,
      phone: member.phone,
      address: member.address,
      membershipPlan: member.membershipPlan?._id || "",
      joinDate: member.joinDate ? format(new Date(member.joinDate), "yyyy-MM-dd") : today,
      status: member.status,
      personalTraining: member.personalTraining ? "Yes" : "No",
      personalTrainerId: member.personalTrainerId?._id || member.personalTrainerId || "",
      photo: member.photo || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await api.delete(`/members/${id}`);
      fetchData();
    }
  };

  // Filtering + pagination
  const filteredMembers = members.map((member: any) => {
    let dynamicStatus = member.status;
    if (member.status === "Active" && member.expiryDate) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      if (new Date(member.expiryDate) < todayDate) dynamicStatus = "Expired";
    }
    return { ...member, dynamicStatus };
  }).filter((member: any) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm);
    const matchesStatus = filterStatus === "All" || member.dynamicStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSearchChange  = (val: string) => { setSearchTerm(val);   setMembersPage(1); };
  const handleStatusChange  = (val: string) => { setFilterStatus(val); setMembersPage(1); };

  const membersTotalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);
  const paginatedMembers  = filteredMembers.slice(
    (membersPage - 1) * PAGE_SIZE,
    membersPage * PAGE_SIZE
  );

  if (loading) return <div className="p-8">Loading members...</div>;

  return (
    <div className="space-y-6">

      {/* Photo Viewer Modal */}
      {photoMember && (
        <PhotoModal member={photoMember} onClose={() => setPhotoMember(null)} />
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Members Directory</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{filteredMembers.length} Total Members</p>
        </div>
        <button
          onClick={openAdd}
          className="flex flex-shrink-0 items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Register Member
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none appearance-none bg-white transition-all cursor-pointer"
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Temporary Discontinue">Temporary Discontinue</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
                <th className="p-4 font-bold text-center">Join Date</th>
                <th className="p-4 font-bold text-center">Expiry Date</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member: any) => (
                <tr
                  key={member._id}
                  className={`border-b last:border-0 transition-colors ${member.dynamicStatus === "Expired" ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}
                >
                  {/* Name + avatar — click to view photo */}
                  <td className="p-4">
                    <button
                      onClick={() => setPhotoMember(member)}
                      className="flex items-center gap-2.5 group text-left"
                      title="Click to view photo"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0 flex items-center justify-center">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors underline-offset-2 group-hover:underline">
                          {member.name}
                        </div>
                        <div className="text-xs text-[var(--muted-foreground)]">
                          ID: {member._id.substr(member._id.length - 6).toUpperCase()}
                        </div>
                      </div>
                    </button>
                  </td>

                  <td className="p-4">
                    <div className="text-sm font-medium">{member.phone}</div>
                    <div className="text-xs text-[var(--muted-foreground)] truncate max-w-[150px]">{member.address}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold">{member.membershipPlan?.name || "N/A"}</div>
                    <div className="text-xs text-[var(--primary)] font-medium">₹{member.membershipPlan?.price}</div>
                  </td>
                  <td className="p-4">
                    {member.personalTraining ? (
                      <div className="text-sm font-medium text-blue-600">
                        {staff.find((s) => s._id === (member.personalTrainerId?._id || member.personalTrainerId))?.name || "Unassigned"}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No PT</div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      member.dynamicStatus === "Active"
                        ? "bg-green-100 text-green-700"
                        : member.dynamicStatus === "Temporary Discontinue"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {member.dynamicStatus}
                    </span>
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-[var(--muted-foreground)]">
                    <div className="flex items-center justify-center gap-1">
                      <CalendarDays size={13} className="text-blue-400" />
                      {member.joinDate ? format(new Date(member.joinDate), "MMM dd, yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-center text-sm font-medium text-[var(--muted-foreground)]">
                    <div className={`flex items-center justify-center gap-1 ${member.dynamicStatus === "Expired" ? "text-red-500 font-semibold" : ""}`}>
                      <CalendarDays size={13} className={member.dynamicStatus === "Expired" ? "text-red-400" : "text-orange-400"} />
                      {member.expiryDate ? format(new Date(member.expiryDate), "MMM dd, yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(member)} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(member._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--muted-foreground)] font-medium bg-gray-50">
                    No members found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={membersPage}
          totalPages={membersTotalPages}
          onPageChange={(p) => setMembersPage(p)}
          totalItems={filteredMembers.length}
          itemsPerPage={PAGE_SIZE}
        />
      </div>

      {/* Register / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-xl my-8">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6 border-b pb-4">
              {currentMember.id ? "Edit Member Details" : "Register New Member"}
            </h2>
            <form onSubmit={handleSave} className="space-y-5">

              {/* Photo Upload */}
              <ImageUploadField
                photoUrl={currentMember.photo}
                onPhotoUploaded={(url) => setCurrentMember({ ...currentMember, photo: url })}
              />

              {/* Name + Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Full Name</label>
                  <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.name} onChange={(e) => setCurrentMember({ ...currentMember, name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Phone Number</label>
                  <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.phone} onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })} placeholder="+91 98765 43210" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Address</label>
                <textarea rows={2} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm resize-none" value={currentMember.address} onChange={(e) => setCurrentMember({ ...currentMember, address: e.target.value })} placeholder="123 Main St..." />
              </div>

              {/* Plan + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Membership Plan</label>
                  <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.membershipPlan} onChange={(e) => setCurrentMember({ ...currentMember, membershipPlan: e.target.value })}>
                    <option value="" disabled>Select a plan</option>
                    {plans.map((p: any) => <option key={p._id} value={p._id}>{p.name} - ₹{p.price} ({p.duration} mo)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Status</label>
                  <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.status} onChange={(e) => setCurrentMember({ ...currentMember, status: e.target.value })}>
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Temporary Discontinue">Temporary Discontinue</option>
                  </select>
                </div>
              </div>

              {/* Join Date + Expiry Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Join Date</label>
                  <input required type="date" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentMember.joinDate} onChange={(e) => setCurrentMember({ ...currentMember, joinDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                    Expiry Date <span className="text-xs font-normal text-blue-500">(auto-calculated)</span>
                  </label>
                  <div className={`w-full border p-3 rounded-xl shadow-sm text-sm flex items-center gap-2 ${expiryPreview ? "bg-blue-50 border-blue-200 text-blue-700 font-semibold" : "bg-gray-50 text-gray-400"}`}>
                    <CalendarDays size={15} />
                    {expiryPreview ? format(expiryPreview, "MMM dd, yyyy") : "Select plan & join date"}
                  </div>
                </div>
              </div>

              {/* Personal Training */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Personal Training</label>
                  <select className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.personalTraining} onChange={(e) => setCurrentMember({ ...currentMember, personalTraining: e.target.value, personalTrainerId: e.target.value === "No" ? "" : currentMember.personalTrainerId })}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {currentMember.personalTraining === "Yes" && (
                  <div>
                    <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Select Personal Trainer</label>
                    <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentMember.personalTrainerId} onChange={(e) => setCurrentMember({ ...currentMember, personalTrainerId: e.target.value })}>
                      <option value="" disabled>Select a trainer</option>
                      {staff.map((s: any) => <option key={s._id} value={s._id}>{s.name} - {s.phone}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
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
