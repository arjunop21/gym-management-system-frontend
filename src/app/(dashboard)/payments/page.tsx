"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Plus, CreditCard, CalendarDays, RefreshCw, Edit2, ArrowLeft, Zap, Search, Trash2 } from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";

const PAGE_SIZE = 5;

function PaymentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [payments, setPayments] = useState<any[]>([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [fromDashboard, setFromDashboard] = useState(false);

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentIdToDelete, setPaymentIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Autocomplete state
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const emptyForm = {
    id: "",
    memberId: "",
    membershipPlan: "",
    amount: "",
    renewDate: todayStr,
    expiryDate: "",
    status: "Paid",
  };

  const [form, setForm] = useState(emptyForm);

  // ── Helpers ──────────────────────────────────────────────────
  const getSelectedMember = () => members.find((m: any) => m._id === form.memberId);
  const getSelectedPlan   = () => plans.find((p: any) => p._id === form.membershipPlan);

  const calcExpiry = (renewDateStr: string, planId: string): string => {
    const plan = plans.find((p: any) => p._id === planId);
    if (!plan || !renewDateStr) return "";
    const d = new Date(renewDateStr);
    d.setMonth(d.getMonth() + plan.duration);
    return format(d, "yyyy-MM-dd");
  };

  const handleMemberChange = useCallback((memberId: string) => {
    const member = members.find((m: any) => m._id === memberId);
    const prevExpiry = member?.expiryDate
      ? format(new Date(member.expiryDate), "yyyy-MM-dd")
      : todayStr;
    const planId = form.membershipPlan || member?.membershipPlan?._id || "";
    const newExpiry = calcExpiry(prevExpiry, planId);
    
    setForm((f) => ({
      ...f,
      memberId,
      renewDate: prevExpiry,
      membershipPlan: planId,
      amount: planId ? String(plans.find((p: any) => p._id === planId)?.price ?? "") : f.amount,
      expiryDate: newExpiry,
    }));
  }, [members, plans, form.membershipPlan, todayStr]);

  const handlePlanChange = (planId: string) => {
    const plan = plans.find((p: any) => p._id === planId);
    const newExpiry = calcExpiry(form.renewDate, planId);
    setForm((f) => ({
      ...f,
      membershipPlan: planId,
      amount: plan ? String(plan.price) : f.amount,
      expiryDate: newExpiry,
    }));
  };

  const handleRenewDateChange = (val: string) => {
    const newExpiry = calcExpiry(val, form.membershipPlan);
    setForm((f) => ({ ...f, renewDate: val, expiryDate: newExpiry }));
  };

  // ── Autocomplete Filtering ────────────────────────────────────
  const filteredMembers = members.filter((m: any) =>
    m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.phone.includes(memberSearch)
  ).slice(0, 5);

  const selectMember = (m: any) => {
    setMemberSearch(m.name);
    setShowMemberDropdown(false);
    handleMemberChange(m._id);
  };

  // ── Data fetch ───────────────────────────────────────────────
  const fetchData = useCallback(async (page: number) => {
    try {
      const [paymentsRes, membersRes, plansRes] = await Promise.all([
        api.get(`/payments?page=${page}&limit=${PAGE_SIZE}`),
        api.get("/members"),
        api.get("/plans"),
      ]);
      setPayments(paymentsRes.data.payments);
      setTotalPayments(paymentsRes.data.total);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { 
    fetchData(paymentsPage); 
  }, [paymentsPage, fetchData]);

  const handleRefresh = () => fetchData(paymentsPage);

  // ── Auto-open from dashboard / redirect ──────────────────────
  useEffect(() => {
    if (loading) return;
    const memberId = searchParams.get("memberId");
    const isDash   = searchParams.get("fromDashboard") === "true";
    if (memberId && isDash && members.length > 0) {
      setFromDashboard(true);
      setError("");
      const member = members.find((m: any) => m._id === memberId);
      if (member) {
        setMemberSearch(member.name);
        handleMemberChange(member._id);
        setIsModalOpen(true);
      }
    }
  }, [loading, members, searchParams, handleMemberChange]);

  const openCreate = () => {
    setForm(emptyForm);
    setMemberSearch("");
    setFromDashboard(false);
    setError("");
    setIsModalOpen(true);
  };

  const openEdit = (payment: any) => {
    setFromDashboard(false);
    setMemberSearch(payment.memberId?.name || "");
    setForm({
      id: payment._id,
      memberId: payment.memberId?._id || "",
      membershipPlan: payment.membershipPlan?._id || "",
      amount: String(payment.amount),
      renewDate: payment.renewDate ? format(new Date(payment.renewDate), "yyyy-MM-dd") : todayStr,
      expiryDate: payment.expiryDate ? format(new Date(payment.expiryDate), "yyyy-MM-dd") : "",
      status: payment.status,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setError("");
    if (!form.memberId || !form.membershipPlan || !form.amount || !form.renewDate || !form.expiryDate) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) { await api.put(`/payments/${form.id}`, form); }
      else { await api.post("/payments", form); }
      setIsModalOpen(false);
      setForm(emptyForm);
      if (fromDashboard) { router.push("/"); return; }
      handleRefresh();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save payment.");
    } finally { setSaving(false); }
  };

  const handleDeletePayment = async () => {
    if (!paymentIdToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/payments/${paymentIdToDelete}`);
      setIsDeleteModalOpen(false);
      setPaymentIdToDelete(null);
      handleRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setPaymentIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  if (loading) return <div className="p-8">Loading payments...</div>;

  const isEdit = Boolean(form.id);
  const memberLocked = isEdit || fromDashboard;
  const paymentsTotalPages = Math.ceil(totalPayments / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments History</h1>
          <p className="text-gray-500 text-sm">{totalPayments} Transactions Found</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Member Name</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any) => (
                <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-semibold">{payment.memberId?.name || "Unknown"}</div>
                    <div className="text-xs text-gray-400">{payment.memberId?.phone}</div>
                  </td>
                  <td className="p-4 font-bold">₹{payment.amount}</td>
                  <td className="p-4 text-sm text-gray-500">{payment.date ? format(new Date(payment.date), "MMM dd, yyyy") : "N/A"}</td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${payment.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(payment)} className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center gap-1">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={() => openDeleteModal(payment._id)} className="text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg border border-red-100">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={paymentsPage} totalPages={paymentsTotalPages} onPageChange={(p) => setPaymentsPage(p)} totalItems={totalPayments} itemsPerPage={PAGE_SIZE} />
      </div>

      <DeleteConfirmationModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={handleDeletePayment} 
        title="Delete Payment" 
        message="Are you sure you want to delete this payment record? This action is permanent and will remove the transaction from history."
        loading={isDeleting}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 py-8">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{isEdit ? "Edit Payment" : "Record New Payment"}</h2>
            
            {getSelectedMember() && (
              <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
                <p className="text-blue-600 font-semibold">{getSelectedMember()?.name}</p>
                <p className="text-blue-400 text-xs">Expiry: {getSelectedMember()?.expiryDate ? format(new Date(getSelectedMember().expiryDate), "MMM dd, yyyy") : "None"}</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">Member *</label>
                {memberLocked ? (
                  <div className="w-full border p-3 rounded-xl bg-gray-50 text-sm font-medium text-gray-600 flex justify-between items-center">
                    <span>{getSelectedMember()?.name} — {getSelectedMember()?.phone}</span>
                    <Zap size={12} className="text-orange-400" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full border pl-9 p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] outline-none"
                        placeholder="Search name or phone..."
                        value={memberSearch}
                        onChange={(e) => { setMemberSearch(e.target.value); setShowMemberDropdown(true); }}
                        onFocus={() => setShowMemberDropdown(true)}
                      />
                    </div>
                    {showMemberDropdown && memberSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredMembers.length > 0 ? filteredMembers.map((m: any) => (
                          <button key={m._id} type="button" onClick={() => selectMember(m)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-0">
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className="text-xs text-gray-400">{m.phone}</div>
                          </button>
                        )) : <div className="p-4 text-center text-gray-400 text-sm italic">No results found.</div>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">Plan *</label>
                <select required className="w-full border p-3 rounded-xl outline-none bg-white" value={form.membershipPlan} onChange={(e) => handlePlanChange(e.target.value)}>
                  <option value="" disabled>Select plan</option>
                  {plans.map((p: any) => <option key={p._id} value={p._id}>{p.name} - ₹{p.price}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">Renew Date</label>
                  <input required type="date" className="w-full border p-3 rounded-xl outline-none" value={form.renewDate} onChange={(e) => handleRenewDateChange(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1.5">New Expiry</label>
                  <input type="date" className="w-full border p-3 rounded-xl outline-none bg-gray-50" value={form.expiryDate} readOnly />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1.5">Amount (₹) *</label>
                <input required type="number" className="w-full border p-3 rounded-xl outline-none" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); if (fromDashboard) router.push("/"); }} className="flex-1 py-3 border rounded-xl font-bold text-gray-500">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--primary)] text-white py-3 rounded-xl font-bold shadow-md disabled:opacity-50">{saving ? "Saving..." : "Save Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading payments...</div>}>
      <PaymentsContent />
    </Suspense>
  );
}
