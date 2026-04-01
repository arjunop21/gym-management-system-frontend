"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Edit2, Trash2 } from "lucide-react";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState({ id: "", name: "", price: "", duration: "" });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/plans");
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      if (currentPlan.id) {
        await api.put(`/plans/${currentPlan.id}`, currentPlan);
      } else {
        await api.post("/plans", currentPlan);
      }
      setIsModalOpen(false);
      fetchPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (plan: any) => {
    setCurrentPlan({ id: plan._id, name: plan.name, price: plan.price, duration: plan.duration });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure?")) {
      await api.delete(`/plans/${id}`);
      fetchPlans();
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Membership Plans</h1>
          <p className="text-[var(--muted-foreground)] text-sm">Manage available plans and pricing</p>
        </div>
        <button 
          onClick={() => { setCurrentPlan({ id: "", name: "", price: "", duration: "" }); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md"
        >
          <Plus size={16} /> Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan: any) => (
          <div key={plan._id} className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)] relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 p-4 flex gap-2">
              <button onClick={() => openEdit(plan)} className="text-[var(--primary)] hover:bg-[var(--muted)] p-2 rounded-full transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(plan._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash2 size={16} /></button>
            </div>
            
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">Plan</div>
              <h2 className="text-2xl font-bold text-[var(--foreground)]">{plan.name}</h2>
              <div className="my-6">
                <span className="text-4xl font-extrabold text-[var(--primary)]">${plan.price}</span>
                <span className="text-[var(--muted-foreground)] font-medium"> / {plan.duration} months</span>
              </div>
            </div>
            
            <div className="bg-[var(--background)] px-4 py-2 rounded-lg text-center text-sm font-medium text-[var(--foreground)]">
              Duration: {plan.duration} Months
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">{currentPlan.id ? "Edit Plan" : "Add Plan"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Plan Name</label>
                <input required type="text" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" value={currentPlan.name} onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})} placeholder="e.g. Premium" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Price ($)</label>
                <input required type="number" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" value={currentPlan.price} onChange={e => setCurrentPlan({...currentPlan, price: e.target.value})} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Duration (Months)</label>
                <input required type="number" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-[var(--primary)] focus:outline-none" value={currentPlan.duration} onChange={e => setCurrentPlan({...currentPlan, duration: e.target.value})} placeholder="1" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
                <button type="submit" className="flex-1 bg-[var(--primary)] text-white px-4 py-2 rounded-xl border border-transparent hover:bg-[var(--foreground)] font-medium shadow-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
