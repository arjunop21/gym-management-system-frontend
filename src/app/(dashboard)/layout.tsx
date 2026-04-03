"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Users, CreditCard, CalendarDays, BarChart3, Settings, LogOut,
  Menu, X, Dumbbell, ClipboardList, PackageSearch
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Members", href: "/members", icon: Users },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Plans", href: "/plans", icon: PackageSearch },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Attendance", href: "/attendance", icon: CalendarDays },
  { name: "Reports", href: "/reports", icon: ClipboardList },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("admin");
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-border transition-transform transform lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-[var(--primary)] text-white">
          <div className="flex items-center space-x-2 font-bold text-xl">
            <img src="https://drive.google.com/uc?export=view&id=12g6E8pdFlqyynrtogN63itWb0xIUij3g" alt="Logo" className="w-10 h-auto object-contain rounded drop-shadow-md" />
            <span>Cochin Fitness</span>
          </div>
          <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)] bg-[var(--card)] text-[var(--card-foreground)]">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-xl transition-all font-medium",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-white" : "text-[var(--primary)] opacity-70")} />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-8 mt-8 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-[var(--muted-foreground)] font-medium rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500 opacity-70" />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex flex-shrink-0 items-center justify-between h-16 px-6 bg-white border-b border-border shadow-sm z-10">
          <div className="flex items-center lg:hidden">
            <button onClick={() => setSidebarOpen(true)} className="text-[var(--foreground)] hover:text-[var(--primary)]">
              <Menu className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center justify-end w-full">
            <div className="ml-4 flex items-center md:ml-6 gap-4">
              <div className="h-10 w-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold shadow-md">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto w-full p-4 lg:p-8 bg-[var(--background)]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
