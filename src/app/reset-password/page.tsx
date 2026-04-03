"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/auth/change-password', { 
        email, 
        oldPassword, 
        newPassword 
      });
      setMessage(response.data.message);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password. Make sure old password is correct.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-[var(--separator)]">
        
        <div className="flex flex-col items-center">
          <div className="bg-[var(--primary)] text-white p-4 rounded-full shadow-lg mb-4">
            <Lock size={40} />
          </div>
          <h2 className="mt-2 text-center text-2xl font-extrabold text-[var(--foreground)]">
            Change Password
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--muted-foreground)]">
            Verify your old password to set a new one
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          {error && (
             <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
               <p className="text-red-700 text-sm font-medium">{error}</p>
             </div>
           )}
           {message && (
             <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-md">
               <p className="text-green-700 text-sm font-medium">{message}</p>
             </div>
           )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                type="email"
                required
                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent sm:text-sm transition-all"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                 type={showOldPassword ? "text" : "password"}
                required
                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent sm:text-sm transition-all"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[var(--primary)] transition-colors"
                tabIndex={-1}
              >
                {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                 type={showNewPassword ? "text" : "password"}
                required
                className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent sm:text-sm transition-all"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
               <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[var(--primary)] transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <button
               type="submit"
               disabled={loading || Boolean(message)}
               className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
             >
               {loading ? 'Verifying...' : 'Update Password'}
            </button>
          </div>
        </form>
        <div className="flex items-center justify-center mt-4">
           <div className="text-sm">
             <Link href="/login" className="font-medium text-[var(--primary)] hover:text-[var(--foreground)] transition">
               Back to Login
             </Link>
           </div>
         </div>
      </div>
    </div>
  );
}
