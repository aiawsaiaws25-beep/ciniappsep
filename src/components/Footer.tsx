import React from "react";
import Link from "next/link";
import { Film, ShieldCheck, Zap, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-white/10 pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white">
                Cine<span className="text-primary">Book</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered for seamless cinema experiences, instant seat reservation, and high-fidelity IMAX & Dolby Atmos bookings.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Neon PostgreSQL + Concurrency Safe</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#now-showing" className="hover:text-white transition-colors">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link href="/#coming-soon" className="hover:text-white transition-colors">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link href="/cinemas" className="hover:text-white transition-colors">
                  Cinemas & IMAX Theaters
                </Link>
              </li>
              <li>
                <Link href="/#experiences" className="hover:text-white transition-colors">
                  VIP & Recliner Lounges
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Technology Highlights */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Architecture</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Next.js 14 App Router
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Neon Serverless PostgreSQL
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" /> Drizzle ORM Schema & Migrations
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> 10-Min Atomic Seat Locks
              </li>
            </ul>
          </div>

          {/* Col 4: Demo Credentials */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-card border border-white/10">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Demo Credentials</h4>
            <div className="space-y-1.5 text-[11px]">
              <div>
                <span className="text-amber-400 font-semibold">Admin:</span> admin@cinebook.com
              </div>
              <div>
                <span className="text-slate-300 font-semibold">User:</span> user@cinebook.com
              </div>
              <div>
                <span className="text-slate-400 font-semibold">Password:</span> Admin123! / User123!
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CineBook Inc. Built for production deployment on Vercel.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link href="/admin" className="hover:text-slate-300 transition-colors">
              Admin Portal
            </Link>
            <a href="https://vercel.com" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition-colors">
              Vercel Ready
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
