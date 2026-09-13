"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import {
  Ticket,
  Film,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Sparkles,
} from "lucide-react";

export default function MyBookingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/my-bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load user bookings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchBookings();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancellingBookingId(cancelModalBooking.id);
      const res = await fetch(`/api/bookings/${cancelModalBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFeedbackMsg({ type: "error", text: data.error || "Failed to cancel booking" });
      } else {
        setFeedbackMsg({
          type: "success",
          text: `Booking ${cancelModalBooking.bookingReference} has been cancelled and refunded (${formatCents(cancelModalBooking.totalCents)}).`,
        });
        setCancelModalBooking(null);
        fetchBookings();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Network error" });
    } finally {
      setCancellingBookingId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
        <Ticket className="w-16 h-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Sign In to View Bookings</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          Access your digital passes, QR entry codes, and manage active reservations.
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white shadow-lg shadow-primary/30"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => b.status === "CONFIRMED");
  const pastBookings = bookings.filter((b) => b.status !== "CONFIRMED");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Account Tickets
          </span>
          <h1 className="text-3xl font-black text-white mt-1">My Cinema Bookings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <strong className="text-slate-200">{user.email}</strong>
          </p>
        </div>

        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white flex items-center gap-2 transition-all shadow"
        >
          <Film className="w-4 h-4" />
          <span>Book Another Movie</span>
        </Link>
      </div>

      {/* Feedback message banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-red-500/15 border-red-500/40 text-red-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Bookings Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-5 h-5 text-primary" />
          <span>Active Tickets ({activeBookings.length})</span>
        </h2>

        {activeBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeBookings.map((b) => (
              <div
                key={b.id}
                className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col justify-between space-y-6"
              >
                <div className="flex gap-4 items-start">
                  <div className="relative w-20 aspect-[2/3] rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10 shadow">
                    <Image
                      src={b.showtime.movie.posterUrl}
                      alt={b.showtime.movie.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-black text-emerald-400 uppercase">
                        CONFIRMED
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {b.bookingReference}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white truncate">
                      {b.showtime.movie.title}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{formatDate(b.showtime.startTime)}</span>
                        <span className="text-slate-200 font-bold">• {formatTime(b.showtime.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate">
                          {b.showtime.auditorium.cinema.name} ({b.showtime.auditorium.name})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seats & Price */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Seats</span>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {b.items.map((i: any) => (
                        <span key={i.id} className="text-slate-200 font-semibold">
                          {i.seatLabel},
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid</span>
                    <span className="text-base font-black text-emerald-400">
                      {formatCents(b.totalCents)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/tickets/${b.id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white text-center flex items-center justify-center gap-2 shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Digital QR Ticket</span>
                  </Link>

                  <button
                    onClick={() => setCancelModalBooking(b)}
                    className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 transition-colors"
                  >
                    Cancel & Refund
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl glass-card text-center space-y-3">
            <Ticket className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Active Bookings</h3>
            <p className="text-xs text-slate-400">
              You do not have any upcoming showtimes. Browse our current movies to reserve your seats.
            </p>
          </div>
        )}
      </div>

      {/* Past / Cancelled Bookings */}
      {pastBookings.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-white/10">
          <h2 className="text-xl font-bold text-slate-400">Past & Cancelled Bookings</h2>

          <div className="space-y-3">
            {pastBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-surface-raised border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          b.status === "REFUNDED" || b.status === "CANCELLED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{b.bookingReference}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{b.showtime.movie.title}</h4>
                    <span className="text-xs text-slate-500">
                      {formatDate(b.showtime.startTime)} • {b.showtime.auditorium.cinema.name}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-300">{formatCents(b.totalCents)}</span>
                  <span className="text-[10px] text-slate-500 block">
                    {b.items.length} Seat(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-card p-6 sm:p-8 rounded-3xl border border-white/20 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Cancel Booking & Request Refund</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel booking{" "}
              <strong className="text-white font-mono">{cancelModalBooking.bookingReference}</strong> for{" "}
              <strong className="text-white">{cancelModalBooking.showtime.movie.title}</strong>? Your reserved seats will be immediately released to other moviegoers and{" "}
              <strong className="text-emerald-400">{formatCents(cancelModalBooking.totalCents)}</strong> will be refunded.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase">
                Reason for cancellation (optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Schedule conflict"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2.5 rounded-xl bg-white/10 text-xs font-bold text-slate-300 hover:text-white"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={cancellingBookingId === cancelModalBooking.id}
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                {cancellingBookingId === cancelModalBooking.id ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing Refund...</span>
                  </>
                ) : (
                  <span>Yes, Cancel & Refund</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
