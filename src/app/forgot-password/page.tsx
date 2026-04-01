"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetUrl('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
      if (response.data.resetToken) {
        setResetUrl(`${window.location.origin}/reset-password?token=${response.data.resetToken}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-[var(--separator)]">

        <div className="flex flex-col items-center">
          <div className="bg-blue-100 text-blue-600 p-4 rounded-full shadow-lg mb-4">
            <KeyRound size={40} />
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-[var(--foreground)]">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--muted-foreground)] px-4">
            Enter your admin email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-md">
              <p className="text-green-700 text-sm font-medium">{message}</p>
              {resetUrl && (
                <a href={resetUrl} className="block mt-2 text-blue-600 underline font-semibold">
                  Click here to reset your password
                </a>
              )}
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
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center mt-6 pt-4 border-t">
          <Link href="/login" className="flex items-center text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] transition">
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
