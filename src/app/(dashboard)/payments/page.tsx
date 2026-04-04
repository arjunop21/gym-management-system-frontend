"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, CreditCard, CalendarDays, RefreshCw, Edit2 } from "lucide-react";
import { format } from "date-fns";
import Pagination from "@/components/Pagination";

const PAGE_SIZE = 5;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [paymentsPage, setPaymentsPage] = useState(1);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const emptyForm = {
    id: "",               // empty = create, filled = edit
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

  const handleMemberChange = (memberId: string) => {
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
  };

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

  // ── Data fetch ───────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [paymentsRes, membersRes, plansRes] = await Promise.all([
        api.get("/payments"),
        api.get("/members"),
        api.get("/plans"),
      ]);
      setPayments(paymentsRes.data);
      setMembers(membersRes.data);
      setPlans(plansRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Open for CREATE ──────────────────────────────────────────
  const openCreate = () => {
    setForm(emptyForm);
    setError("");
    setIsModalOpen(true);
  };

  // ── Open for EDIT ────────────────────────────────────────────
  const openEdit = (payment: any) => {
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

  // ── Submit (create or update) ────────────────────────────────
  const handleSave = async (e: any) => {
    e.preventDefault();
    setError("");
    if (!form.memberId || !form.membershipPlan || !form.amount || !form.renewDate || !form.expiryDate) {
      setError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/payments/${form.id}`, form);
      } else {
        await api.post("/payments", form);
      }
      setIsModalOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save payment.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading payments...</div>;

  const isEdit = Boolean(form.id);

  const paymentsTotalPages = Math.ceil(payments.length / PAGE_SIZE);
  const paginatedPayments  = payments.slice(
    (paymentsPage - 1) * PAGE_SIZE,
    paymentsPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Payments History</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{payments.length} Transactions Found</p>
        </div>
        <button
          onClick={openCreate}
          className="flex flex-shrink-0 items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Member Name</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Payment Date</th>
                <th className="p-4 font-bold">Plan</th>
                <th className="p-4 font-bold">Renew Date</th>
                <th className="p-4 font-bold">Expiry Date</th>
                <th className="p-4 font-bold text-center">Status</th>
                <th className="p-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.map((payment: any) => (
                <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-[var(--foreground)]">{payment.memberId?.name || "Unknown"}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{payment.memberId?.phone || ""}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1">
                      <CreditCard size={14} className="text-[var(--primary)]" />
                      ₹{payment.amount}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-[var(--muted-foreground)]">
                    {payment.date ? format(new Date(payment.date), "MMM dd, yyyy") : "N/A"}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">
                      {payment.membershipPlan?.name || "N/A"}
                    </div>
                    {payment.membershipPlan?.duration && (
                      <div className="text-xs text-[var(--primary)] font-medium">
                        {payment.membershipPlan.duration} month{payment.membershipPlan.duration > 1 ? "s" : ""}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                      <RefreshCw size={13} className="text-blue-400" />
                      {payment.renewDate ? format(new Date(payment.renewDate), "MMM dd, yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)]">
                      <CalendarDays size={13} className="text-orange-400" />
                      {payment.expiryDate ? format(new Date(payment.expiryDate), "MMM dd, yyyy") : "N/A"}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${payment.status === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => openEdit(payment)}
                      className="inline-flex items-center gap-1.5 text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-blue-100"
                      title="Edit payment"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--muted-foreground)] font-medium bg-gray-50">
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={paymentsPage}
          totalPages={paymentsTotalPages}
          onPageChange={(p) => setPaymentsPage(p)}
          totalItems={payments.length}
          itemsPerPage={PAGE_SIZE}
        />
      </div>

      {/* ── Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-lg my-8">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--foreground)]">
                  {isEdit ? "Edit Payment" : "Record New Payment"}
                </h2>
                {isEdit && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    Changes will also update the member's join date & expiry date.
                  </p>
                )}
              </div>
              {isEdit && (
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full border border-blue-200">
                  Editing
                </span>
              )}
            </div>

            {/* Member info banner */}
            {getSelectedMember() && (
              <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm">
                <p className="text-blue-600 font-semibold">{getSelectedMember()?.name}</p>
                <p className="text-blue-400 text-xs mt-0.5">
                  Current expiry:{" "}
                  <span className="font-bold">
                    {getSelectedMember()?.expiryDate
                      ? format(new Date(getSelectedMember().expiryDate), "MMM dd, yyyy")
                      : "No expiry set"}
                  </span>
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">

              {/* Member — read-only when editing */}
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                  Member <span className="text-red-400">*</span>
                </label>
                {isEdit ? (
                  <div className="w-full border p-3 rounded-xl bg-gray-50 text-sm font-medium text-gray-600">
                    {getSelectedMember()?.name || "Unknown"} — {getSelectedMember()?.phone || ""}
                  </div>
                ) : (
                  <select
                    required
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white"
                    value={form.memberId}
                    onChange={(e) => handleMemberChange(e.target.value)}
                  >
                    <option value="" disabled>Select a member</option>
                    {members.map((m: any) => (
                      <option key={m._id} value={m._id}>{m.name} — {m.phone}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Membership Plan */}
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                  Membership Plan <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white"
                  value={form.membershipPlan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="" disabled>Select a plan</option>
                  {plans.map((p: any) => (
                    <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.duration} mo)</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                  Amount (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="number"
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Auto-filled from plan"
                />
              </div>

              {/* Renew Date + Expiry Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                    Membership Renew Date <span className="text-red-400">*</span>
                    <span className="ml-1 text-xs font-normal text-blue-500">(editable)</span>
                  </label>
                  <input
                    required
                    type="date"
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm"
                    value={form.renewDate}
                    onChange={(e) => handleRenewDateChange(e.target.value)}
                  />
                  <p className="text-xs text-blue-500 mt-1 font-medium">
                    {isEdit ? "Edit renewal start date" : "Auto-filled from previous expiry"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">
                    New Expiry Date
                    <span className="ml-1 text-xs font-normal text-blue-500">(editable)</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-blue-50 border-blue-200"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  />
                  <p className="text-xs text-blue-500 mt-1 font-medium">
                    Auto-calculated from renew date + plan
                  </p>
                </div>
              </div>

              {/* Summary pill */}
              {getSelectedPlan() && form.renewDate && form.expiryDate && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700 font-medium flex flex-wrap gap-x-4 gap-y-1">
                  <span>📋 Plan: <strong>{getSelectedPlan()?.name}</strong></span>
                  <span>⏱ Duration: <strong>{getSelectedPlan()?.duration} month(s)</strong></span>
                  <span>🔄 Renew: <strong>{format(new Date(form.renewDate), "MMM dd, yyyy")}</strong></span>
                  <span>📅 Expires: <strong>{form.expiryDate ? format(new Date(form.expiryDate), "MMM dd, yyyy") : "—"}</strong></span>
                  <span className="text-green-600 font-bold">✅ Member dates will sync automatically</span>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Payment Status</label>
                <select
                  required
                  className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setForm(emptyForm); }}
                  className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 font-bold text-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[var(--primary)] text-white px-4 py-3 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all disabled:opacity-60"
                >
                  {saving ? "Saving…" : isEdit ? "Update Payment" : "Submit Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
