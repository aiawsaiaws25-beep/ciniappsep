"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SeatMap, { SeatItem } from "@/components/SeatMap";
import { useAuth } from "@/context/AuthContext";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  Ticket,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

interface ShowtimeLayout {
  showtime: {
    id: string;
    startTime: string;
    endTime: string;
    basePriceCents: number;
    format: string;
    language: string;
    movie: {
      id: string;
      title: string;
      posterUrl: string;
      backdropUrl: string;
      durationMins: number;
      ageRating: string;
    };
    cinema: {
      id: string;
      name: string;
      address: string;
      city: string;
    };
    auditorium: {
      id: string;
      name: string;
      screenType: string;
      totalSeats: number;
    };
  };
  rows: Record<string, SeatItem[]>;
  seats: SeatItem[];
}

export default function BookingPage({ params }: { params: { showtimeId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [layout, setLayout] = useState<ShowtimeLayout | null>(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState(user?.fullName || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Sync user info if available
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.fullName);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  // Fetch showtime layout
  const fetchLayout = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/showtimes/${params.showtimeId}`);
      if (res.ok) {
        const data = await res.json();
        setLayout(data);
      } else {
        setErrorMsg("Failed to load showtime layout.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLayout();
  }, [params.showtimeId]);

  const handleToggleSeat = (seat: SeatItem) => {
    setErrorMsg("");
    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMsg("Maximum of 8 seats per reservation.");
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Calculate live totals on frontend for instant feedback
  const selectedSeatsList = (layout?.seats || []).filter((s) => selectedSeatIds.includes(s.id));
  const subtotalCents = selectedSeatsList.reduce((acc, s) => acc + s.priceCents, 0);
  const serviceFeeCents = selectedSeatsList.length * 150; // $1.50 per seat
  const taxCents = Math.round((subtotalCents + serviceFeeCents) * 0.08);
  const totalCents = subtotalCents + serviceFeeCents + taxCents;

  const handleProceedToHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedSeatIds.length === 0) {
      setErrorMsg("Please select at least one seat on the auditorium map.");
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMsg("Please enter your name and email address to reserve seats.");
      return;
    }

    try {
      setIsSubmitting(true);
      const idempotencyKey = `hold_${params.showtimeId}_${selectedSeatIds.sort().join("_")}_${Date.now()}`;

      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showtimeId: params.showtimeId,
          seatIds: selectedSeatIds,
          customerName,
          customerEmail,
          customerPhone,
          idempotencyKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // If seat was taken by someone else concurrently
        if (res.status === 409) {
          setErrorMsg(data.error || "One or more seats were just reserved by another customer. Please re-select.");
          fetchLayout(); // Refresh live layout
        } else {
          setErrorMsg(data.error || "Failed to reserve seats.");
        }
        return;
      }

      // Success -> Redirect to checkout with active hold timer
      router.push(`/checkout/${data.bookingId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Showtime Unavailable</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white">
          Back to Movies
        </Link>
      </div>
    );
  }

  const { showtime } = layout;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
      {/* 1. Header Information Strip */}
      <div className="p-6 rounded-3xl glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10 shadow-md">
            <Image
              src={showtime.movie.posterUrl}
              alt={showtime.movie.title}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/20 text-[10px] font-black text-primary uppercase">
                {showtime.format}
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-slate-300 uppercase">
                {showtime.movie.ageRating}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{showtime.movie.title}</h1>
            <p className="text-xs text-slate-400">
              {showtime.cinema.name} • {showtime.auditorium.name} ({showtime.auditorium.screenType})
            </p>
          </div>
        </div>

        {/* Date and Time badge */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-raised border border-white/10">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDate(showtime.startTime)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-raised border border-white/10">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-white font-bold">{formatTime(showtime.startTime)}</span>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Seat Selection Grid & Summary Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Seat Map View (2 Cols) */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl glass-card border border-white/10">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Select Your Seats</span>
            </h2>
            <span className="text-xs text-slate-400">Up to 8 seats per booking</span>
          </div>

          <SeatMap
            rows={layout.rows}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        {/* Order Summary & Customer Info (1 Col) */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 sticky top-28">
          <h3 className="text-lg font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Booking Summary</span>
          </h3>

          {/* Selected seats pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Selected Seats:</span>
              <strong className="text-white font-bold">{selectedSeatsList.length} Seat(s)</strong>
            </div>

            {selectedSeatsList.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pt-1">
                {selectedSeatsList.map((s) => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-xl bg-surface-raised border border-primary/40 text-xs font-bold text-white flex items-center gap-1.5"
                  >
                    Row {s.rowLabel}-{s.seatNumber} ({formatCents(s.priceCents)})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No seats selected yet. Click on the seats above.</p>
            )}
          </div>

          {/* Price Breakdown */}
          {selectedSeatsList.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-white/10 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Tickets Subtotal</span>
                <span className="text-white font-medium">{formatCents(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee ($1.50/seat)</span>
                <span className="text-white font-medium">{formatCents(serviceFeeCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax (8%)</span>
                <span className="text-white font-medium">{formatCents(taxCents)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-white">
                <span>Total Amount</span>
                <span className="text-emerald-400 font-extrabold">{formatCents(totalCents)}</span>
              </div>
            </div>
          )}

          {/* Customer Details Form */}
          <form onSubmit={handleProceedToHold} className="space-y-4 pt-4 border-t border-white/10">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g., Jane Doe"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Email for Digital Tickets
              </label>
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g., jane@example.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Mobile Phone (Optional)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +1 (555) 000-0000"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Hold Button */}
            <button
              type="submit"
              disabled={selectedSeatIds.length === 0 || isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-primary hover:bg-primary-hover disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-xs font-black text-white shadow-xl shadow-primary/30 flex items-center justify-center gap-2 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Locking Seats in Neon DB...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Lock Seats & Proceed ({formatCents(totalCents)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
