"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import HoldTimer from "@/components/HoldTimer";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Film,
  Clock,
  Calendar,
  MapPin,
  Lock,
  Sparkles,
  Ticket,
  CheckCircle2,
} from "lucide-react";

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED" | "REFUNDED";
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  customerName: string;
  customerEmail: string;
  expiresAt: string;
  items: Array<{
    id: string;
    seatLabel: string;
    seatType: string;
    unitPriceCents: number;
  }>;
  showtime: {
    startTime: string;
    format: string;
    movie: {
      title: string;
      posterUrl: string;
      durationMins: number;
      ageRating: string;
    };
    auditorium: {
      name: string;
      screenType: string;
      cinema: {
        name: string;
        address: string;
        city: string;
      };
    };
  };
}

export default function CheckoutPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [paymentMode, setPaymentMode] = useState<"SUCCESS" | "FAIL">("SUCCESS");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  const loadBooking = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/bookings/${params.bookingId}`);
      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);

        if (data.booking.status === "CONFIRMED") {
          router.push(`/tickets/${data.booking.id}`);
        }
      } else {
        setErrorMsg("Booking not found or has expired.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load booking.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
  }, [params.bookingId]);

  const handleHoldExpired = () => {
    setErrorMsg("Your 10-minute seat hold has expired. Please select your seats again.");
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!booking) return;

    try {
      setIsProcessing(true);
      const idempotencyKey = `pay_${booking.id}_${booking.bookingReference}_${Date.now()}`;

      const res = await fetch(`/api/bookings/${booking.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: `pi_test_${Date.now()}`,
          provider: "MOCK_TEST",
          idempotencyKey,
          paymentMethod: "visa",
          cardLast4: "4242",
          simulateFailure: paymentMode === "FAIL",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Payment failed. Please retry.");
        return;
      }

      // Success celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Redirect to digital ticket
      setTimeout(() => {
        router.push(`/tickets/${booking.id}`);
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while processing payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-white">Booking Not Found</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white">
          Browse Movies
        </Link>
      </div>
    );
  }

  const isExpired = booking.status === "EXPIRED" || new Date(booking.expiresAt) < new Date();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      {/* 1. Header & Hold Timer Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Secure Encrypted Checkout
          </span>
          <h1 className="text-3xl font-black text-white mt-1">Review & Confirm</h1>
        </div>

        {!isExpired && (
          <HoldTimer expiresAt={booking.expiresAt} onExpire={handleHoldExpired} />
        )}
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Main Checkout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Col: Movie & Seats summary */}
        <div className="md:col-span-2 space-y-6">
          {/* Movie Card */}
          <div className="p-6 rounded-3xl glass-card border border-white/10 flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative w-24 aspect-[2/3] rounded-2xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
              <Image
                src={booking.showtime.movie.posterUrl}
                alt={booking.showtime.movie.title}
                fill
                className="object-cover"
              />
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <span className="px-2 py-0.5 rounded bg-primary/20 text-[10px] font-black text-primary uppercase mr-2">
                  {booking.showtime.format}
                </span>
                <span className="text-xs text-slate-400">{booking.showtime.movie.ageRating}</span>
                <h2 className="text-xl font-bold text-white mt-1">
                  {booking.showtime.movie.title}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{formatDate(booking.showtime.startTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{formatTime(booking.showtime.startTime)}</span>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {booking.showtime.auditorium.cinema.name} — {booking.showtime.auditorium.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reserved Seats List */}
          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" />
              <span>Reserved Seats ({booking.items.length})</span>
            </h3>

            <div className="space-y-2">
              {booking.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-white/5 text-xs font-semibold text-slate-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>{item.seatLabel}</span>
                    <span className="text-[10px] text-slate-400 uppercase">({item.seatType})</span>
                  </div>
                  <span className="text-white font-bold">{formatCents(item.unitPriceCents)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Card Simulation Form */}
          <div className="p-6 rounded-3xl glass-card border border-white/10 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Payment Method (Test Mode)</span>
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Stripe & Mock Enabled
              </span>
            </div>

            {/* Test Mode Switcher */}
            <div className="p-3 rounded-2xl bg-surface-raised border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Test Payment Simulation:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("SUCCESS")}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                    paymentMode === "SUCCESS"
                      ? "bg-emerald-500 text-slate-950 shadow"
                      : "bg-black/40 text-slate-400"
                  }`}
                >
                  Simulate Success
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("FAIL")}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                    paymentMode === "FAIL"
                      ? "bg-red-500 text-white shadow"
                      : "bg-black/40 text-slate-400"
                  }`}
                >
                  Simulate Decline
                </button>
              </div>
            </div>

            {/* Mock Card Input fields */}
            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:border-primary focus:outline-none"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Expires (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    CVC / CVV
                  </label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || isExpired}
                className="w-full mt-4 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-200"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Processing Payment & Issuing Ticket...</span>
                  </>
                ) : isExpired ? (
                  <span>Hold Expired — Reselect Seats</span>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Authorize & Pay {formatCents(booking.totalCents)}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Price Ledger */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 sticky top-28">
          <h3 className="text-base font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Order Ledger</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Tickets ({booking.items.length})</span>
              <span className="font-semibold text-white">{formatCents(booking.subtotalCents)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Service Fee ($1.50/seat)</span>
              <span className="font-semibold text-white">
                {formatCents(booking.serviceFeeCents)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Tax (8%)</span>
              <span className="font-semibold text-white">{formatCents(booking.taxCents)}</span>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-black text-white block">Final Total</span>
                <span className="text-[10px] text-slate-500 font-mono">USD Minor Units (Cents)</span>
              </div>
              <span className="text-2xl font-black text-emerald-400">
                {formatCents(booking.totalCents)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-raised border border-white/5 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Confirmation</span>
            </div>
            <p>
              Your digital ticket and QR pass will be issued immediately upon confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
