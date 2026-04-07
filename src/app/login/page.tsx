"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.replace('/');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });
      Cookies.set('token', response.data.token, { expires: 30 });
      Cookies.set('admin', JSON.stringify(response.data), { expires: 30 });
      
      // Use replace instead of push so user can't go back to login page
      router.replace('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full flex flex-col items-center">

        {/* FLOATING LOGO — overlaps the top of the card */}
        <div className="z-10" style={{ marginBottom: '-60px' }}>
          <Image
            src="/gymlogo.png"
            alt="Cochin Fitness Logo"
            className="w-36 h-36 object-contain drop-shadow-2xl rounded-lg"
            width={144}
            height={144}
          />
        </div>

        {/* LOGIN CARD */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-[var(--separator)]"
          style={{ paddingTop: '80px', paddingBottom: '40px', paddingLeft: '40px', paddingRight: '40px' }}>

          {/* Title */}
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-center text-3xl font-extrabold text-[var(--foreground)]">
              Cochin <span className="text-[var(--primary)]">Fitness</span> Studio
            </h2>
            <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">
              Complete Solution for Health &amp; Fitness
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* LOGIN FORM */}
          <form className="space-y-4" onSubmit={handleLogin}>

            {/* Email */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={20} />
              </div>
              <input
                id="email"
                type="email"
                required
                className="appearance-none rounded-xl block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm transition-all"
                placeholder="Admin Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock size={20} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none rounded-xl block w-full px-3 py-3 pl-10 pr-12 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[var(--primary)] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-[var(--primary)] hover:bg-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)] disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="flex flex-col items-center justify-center mt-6 gap-2">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition">
                Forgot your password?
              </Link>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              Do you want to reset password?
              <Link href="/reset-password" className="font-bold text-blue-600 hover:text-blue-800 transition">
                Reset Password
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
