"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, CreditCard } from "lucide-react";
import { format } from "date-fns";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPayment, setCurrentPayment] = useState({
    memberId: "", amount: "", status: "Paid"
  });

  const fetchData = async () => {
    try {
      const [paymentsRes, membersRes] = await Promise.all([
        api.get("/payments"),
        api.get("/members")
      ]);
      setPayments(paymentsRes.data);
      setMembers(membersRes.data);
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
      await api.post("/payments", currentPayment);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Payments History</h1>
          <p className="text-[var(--muted-foreground)] text-sm">{payments.length} Transactions Found</p>
        </div>
        <button 
          onClick={() => { setCurrentPayment({ memberId: members[0]?._id || "", amount: "", status: "Paid" }); setIsModalOpen(true); }}
          className="flex flex-shrink-0 items-center gap-2 bg-[var(--primary)] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md w-full md:w-auto justify-center"
        >
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[var(--separator)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--muted)] border-b text-[var(--muted-foreground)] text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Transaction ID</th>
                <th className="p-4 font-bold">Member Name</th>
                <th className="p-4 font-bold">Amount</th>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: any) => (
                <tr key={payment._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-mono text-[var(--muted-foreground)] bg-gray-100 px-2 py-1 rounded inline-block">
                      {payment._id.substring(0, 8).toUpperCase()}...
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-[var(--foreground)]">{payment.memberId?.name || "Unknown Member"}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-1">
                      <CreditCard size={14} className="text-[var(--primary)]" />
                      ${payment.amount}
                    </div>
                  </td>
                  <td className="p-4 text-sm font-medium text-[var(--muted-foreground)]">
                    {format(new Date(payment.date), 'MMM dd, yyyy - hh:mm a')}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${payment.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[var(--muted-foreground)] font-medium bg-gray-50">
                    No payment history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-md my-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 border-b pb-4">Record New Payment</h2>
            <form onSubmit={handleSave} className="space-y-5">
              
              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Member</label>
                <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentPayment.memberId} onChange={e => setCurrentPayment({...currentPayment, memberId: e.target.value})}>
                  <option value="" disabled>Select a member</option>
                  {members.map((m: any) => <option key={m._id} value={m._id}>{m.name} - {m.phone}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Amount ($)</label>
                <input required type="number" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} placeholder="0.00" />
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--muted-foreground)] mb-1.5">Payment Status</label>
                <select required className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none transition-all shadow-sm bg-white" value={currentPayment.status} onChange={e => setCurrentPayment({...currentPayment, status: e.target.value})}>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50 font-bold text-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-[var(--primary)] text-white px-4 py-3 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-bold shadow-md transition-all">Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
