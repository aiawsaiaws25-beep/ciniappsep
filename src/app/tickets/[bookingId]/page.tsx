"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import TicketCard from "@/components/TicketCard";
import { Film, CheckCircle2, Ticket, ArrowLeft, Home } from "lucide-react";

export default function TicketConfirmationPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTicket() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/bookings/${params.bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setBooking(data.booking);
        }
      } catch (err) {
        console.error("Failed to load ticket:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTicket();
  }, [params.bookingId]);

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
        <Ticket className="w-16 h-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Ticket Not Found</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-28">
      {/* Top Notice */}
      <div className="text-center space-y-2 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">
          Booking Confirmed!
        </h1>
        <p className="text-xs text-slate-400">
          We have sent a digital copy of your tickets to{" "}
          <strong className="text-slate-200">{booking.customerEmail}</strong>.
        </p>
      </div>

      {/* Boarding pass ticket component */}
      <TicketCard booking={booking} />

      {/* Navigation links */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
        <Link
          href="/my-bookings"
          className="px-6 py-3 rounded-2xl bg-surface-raised hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-2 transition-all shadow"
        >
          <Ticket className="w-4 h-4 text-primary" />
          <span>View All My Bookings</span>
        </Link>

        <Link
          href="/"
          className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-hover text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-primary/30"
        >
          <Home className="w-4 h-4" />
          <span>Browse More Movies</span>
        </Link>
      </div>
    </div>
  );
}
