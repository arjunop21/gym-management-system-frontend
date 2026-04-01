"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Download, FileText, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);

  // Fake data for visual representation, in a real app this would come from the API
  const revenueData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 3000 },
    { name: "Mar", revenue: 5000 },
    { name: "Apr", revenue: 4500 },
    { name: "May", revenue: 6000 },
    { name: "Jun", revenue: 5500 },
  ];

  const memberStatusData = [
    { name: "Active Members", value: 120 },
    { name: "Expired Members", value: 30 },
  ];

  const planDistributionData = [
    { name: "Basic Plan", value: 50 },
    { name: "Premium Plan", value: 80 },
    { name: "Annual MVP", value: 20 },
  ];

  const COLORS = ["#5e6150", "#ef4444", "#a5a58d", "#cb997e"];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => setLoading(false), 500);
  }, []);

  const handleExport = (type: string) => {
    alert(`Exporting ${type} report... (Feature implementation required backend PDF/Excel library like pdfkit or exceljs)`);
  };

  if (loading) return <div className="p-8">Loading reports data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytics & Reports</h1>
          <p className="text-[var(--muted-foreground)] text-sm">Insights into gym performance and revenue</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('PDF')}
            className="flex items-center gap-2 bg-white text-[var(--foreground)] border px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <FileText size={16} className="text-red-500" /> Export PDF
          </button>
          <button 
            onClick={() => handleExport('Excel')}
            className="flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[var(--foreground)] transition-all shadow-md"
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Growth Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><TrendingUp className="text-[var(--primary)]" /> Monthly Revenue Growth</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3de" />
                <XAxis dataKey="name" stroke="#6b705c" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b705c" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`$${value}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Status Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[var(--separator)]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><PieChartIcon className="text-[var(--primary)]" /> Member Status / Plans</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 h-72 gap-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={memberStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" stroke="none">
                  {memberStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planDistributionData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" stroke="#fff" strokeWidth={2}>
                  {planDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
