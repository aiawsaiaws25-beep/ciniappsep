"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import {
  ShieldAlert,
  Film,
  Calendar,
  Ticket,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";

interface AdminMetrics {
  totalRevenueCents: number;
  totalConfirmedBookings: number;
  activeMovies: number;
  activeShowtimes: number;
  totalRegisteredUsers: number;
  occupancyRate: number;
}

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "movies" | "showtimes" | "audit">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Movie Form State
  const [newMovieTitle, setNewMovieTitle] = useState("");
  const [newMovieSlug, setNewMovieSlug] = useState("");
  const [newMovieSynopsis, setNewMovieSynopsis] = useState("");
  const [newMoviePoster, setNewMoviePoster] = useState("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80");
  const [newMovieBackdrop, setNewMovieBackdrop] = useState("https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&q=80");
  const [newMovieDuration, setNewMovieDuration] = useState(140);
  const [newMovieRating, setNewMovieRating] = useState("PG-13");
  const [isCreatingMovie, setIsCreatingMovie] = useState(false);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setRecentBookings(data.recentBookings || []);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error("Failed to load admin metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === "ADMIN") {
      fetchMetrics();
    } else if (!authLoading && user?.role !== "ADMIN") {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingMovie(true);
      setFeedback(null);
      const res = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newMovieTitle,
          slug: newMovieSlug || newMovieTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          synopsis: newMovieSynopsis,
          posterUrl: newMoviePoster,
          backdropUrl: newMovieBackdrop,
          durationMins: Number(newMovieDuration),
          releaseDate: new Date().toISOString(),
          ageRating: newMovieRating,
          language: "English",
          formats: ["2D", "IMAX", "Dolby Atmos"],
          ratingScore: 90,
          isFeatured: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback(`Error: ${data.error}`);
      } else {
        setFeedback(`Movie "${newMovieTitle}" published successfully!`);
        setNewMovieTitle("");
        setNewMovieSlug("");
        setNewMovieSynopsis("");
        fetchMetrics();
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsCreatingMovie(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Administrator Access Required</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          You must be logged in as an administrator to view this control panel. Use credentials <strong className="text-amber-400">admin@cinebook.com</strong> / <strong className="text-white">Admin123!</strong>
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/30"
        >
          Sign In as Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              Operations Center
            </span>
            <h1 className="text-3xl font-black text-white">Admin Management Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {["overview", "movies", "audit"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab
                  ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                  : "bg-surface-raised text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Executive Stat Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Gross Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400">
              {formatCents(metrics.totalRevenueCents)}
            </p>
            <span className="text-[10px] text-slate-500">From confirmed ticket bookings</span>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Confirmed Bookings</span>
              <Ticket className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-black text-white">{metrics.totalConfirmedBookings}</p>
            <span className="text-[10px] text-slate-500">Digital tickets issued</span>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Seat Occupancy Rate</span>
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-3xl font-black text-cyan-400">{metrics.occupancyRate}%</p>
            <span className="text-[10px] text-slate-500">Across scheduled showtimes</span>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Catalog</span>
              <Film className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-white">
              {metrics.activeMovies} <span className="text-sm text-slate-500 font-normal">Movies</span>
            </p>
            <span className="text-[10px] text-slate-500">{metrics.activeShowtimes} Showtimes Scheduled</span>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings Ledger */}
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Live Booking Ledger</span>
            </h3>

            <div className="space-y-3">
              {recentBookings.length > 0 ? (
                recentBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-2xl bg-surface-raised border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">{b.bookingReference}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : b.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <span className="text-slate-300 font-medium block mt-0.5">
                        {b.showtime?.movie?.title || "Movie Booking"}
                      </span>
                      <span className="text-[11px] text-slate-500">{b.customerEmail}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-white block">{formatCents(b.totalCents)}</span>
                      <span className="text-[10px] text-slate-500">{formatTime(b.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No bookings recorded yet.</p>
              )}
            </div>
          </div>

          {/* Real-Time Audit Logs */}
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Recent Transaction Audit Logs</span>
            </h3>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white/10 font-mono font-bold text-slate-200 uppercase">
                      {log.action}
                    </span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px] truncate">
                    Entity: {log.entityType} • ID: {log.entityId}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVIES MANAGER */}
      {activeTab === "movies" && (
        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <span>Create New Movie Entry</span>
            </h3>
          </div>

          <form onSubmit={handleCreateMovie} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Movie Title</label>
                <input
                  type="text"
                  required
                  value={newMovieTitle}
                  onChange={(e) => setNewMovieTitle(e.target.value)}
                  placeholder="e.g. Avatar: Fire and Ash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Slug</label>
                <input
                  type="text"
                  value={newMovieSlug}
                  onChange={(e) => setNewMovieSlug(e.target.value)}
                  placeholder="e.g. avatar-fire-and-ash"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">Synopsis</label>
              <textarea
                rows={3}
                required
                value={newMovieSynopsis}
                onChange={(e) => setNewMovieSynopsis(e.target.value)}
                placeholder="Brief movie storyline..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Poster URL</label>
                <input
                  type="url"
                  required
                  value={newMoviePoster}
                  onChange={(e) => setNewMoviePoster(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Backdrop URL</label>
                <input
                  type="url"
                  required
                  value={newMovieBackdrop}
                  onChange={(e) => setNewMovieBackdrop(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Duration (mins)</label>
                <input
                  type="number"
                  required
                  value={newMovieDuration}
                  onChange={(e) => setNewMovieDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Age Rating</label>
                <select
                  value={newMovieRating}
                  onChange={(e) => setNewMovieRating(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-primary"
                >
                  <option value="G">G (General Audience)</option>
                  <option value="PG">PG</option>
                  <option value="PG-13">PG-13</option>
                  <option value="R">R (Restricted)</option>
                  <option value="NC-17">NC-17</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingMovie}
              className="py-3 px-6 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow flex items-center gap-2"
            >
              {isCreatingMovie ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Publish Movie</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS FULL */}
      {activeTab === "audit" && (
        <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/10 space-y-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Audit Trail Ledger (Last 50 Events)</span>
          </h3>

          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-surface-raised border border-white/5 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-bold text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-bold">{log.entityType}</span>
                  </div>
                  <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  Target ID: {log.entityId}
                </div>
                {log.payload && Object.keys(log.payload).length > 0 && (
                  <pre className="p-2.5 rounded-lg bg-black/50 text-[10px] font-mono text-slate-300 overflow-x-auto">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
