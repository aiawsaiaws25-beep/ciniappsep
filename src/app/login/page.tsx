"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Film, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setErrorMsg(result.error || "Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  const fillDemoUser = () => {
    setEmail("user@cinebook.com");
    setPassword("User123!");
  };

  const fillDemoAdmin = () => {
    setEmail("admin@cinebook.com");
    setPassword("Admin123!");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-xl shadow-primary/30">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Welcome to Cine<span className="text-primary">Book</span>
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your digital passes, loyalty rewards, and seat reservations.
          </p>
        </div>

        {/* Demo Accounts Quick-Fill Pill */}
        <div className="p-3 rounded-2xl bg-surface-raised border border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Quick Fill:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillDemoUser}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-semibold"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@cinebook.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-xs font-bold text-white shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all duration-200"
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-white/10 text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-bold">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
