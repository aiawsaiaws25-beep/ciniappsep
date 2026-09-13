"use client";

import React from "react";
import Image from "next/image";
import { formatCents, formatDate, formatTime } from "@/lib/utils";
import { Film, Calendar, Clock, MapPin, Ticket as TicketIcon, Download, Printer } from "lucide-react";

interface TicketCardProps {
  booking: {
    id: string;
    bookingReference: string;
    status: string;
    totalCents: number;
    customerName: string;
    customerEmail: string;
    createdAt: string | Date;
    items: Array<{
      id: string;
      seatLabel: string;
      seatType: string;
      unitPriceCents: number;
    }>;
    showtime: {
      startTime: string | Date;
      format: string;
      movie: {
        title: string;
        posterUrl: string;
        backdropUrl: string;
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
          state: string;
        };
      };
    };
    tickets?: Array<{
      id: string;
      ticketCode: string;
      qrCodeData: string;
      isUsed: boolean;
    }>;
  };
}

export default function TicketCard({ booking }: TicketCardProps) {
  const handlePrint = () => {
    window.print();
  };

  const firstTicket = booking.tickets?.[0];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Confirmed & Verified Pass
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-raised border border-white/10 text-xs font-bold text-slate-200 hover:text-white hover:border-primary transition-all shadow"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Print Ticket</span>
          </button>
        </div>
      </div>

      {/* Boarding Pass Ticket */}
      <div
        id="printable-ticket"
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#121A2C] via-[#0F1523] to-[#0A0E18] border border-white/15 shadow-2xl shadow-primary/10"
      >
        {/* Holographic Top Banner */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900">
          <Image
            src={booking.showtime.movie.backdropUrl || booking.showtime.movie.posterUrl}
            alt={booking.showtime.movie.title}
            fill
            className="object-cover opacity-40 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121A2C] via-transparent to-transparent" />

          {/* Top Info Header */}
          <div className="absolute top-4 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">
                CINE<span className="text-primary">BOOK</span>
              </span>
            </div>

            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white tracking-widest uppercase">
              {booking.showtime.format}
            </div>
          </div>

          {/* Movie Title in Banner */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              Admit One Per Ticket
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight line-clamp-1">
              {booking.showtime.movie.title}
            </h2>
          </div>
        </div>

        {/* Ticket Details & Tear-Off Section */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Main Info (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Grid of Attributes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Cinema
                </span>
                <p className="text-sm font-bold text-white leading-tight">
                  {booking.showtime.auditorium.cinema.name}
                </p>
                <span className="text-xs text-slate-400">
                  {booking.showtime.auditorium.cinema.city}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Auditorium
                </span>
                <p className="text-sm font-bold text-white">
                  {booking.showtime.auditorium.name}
                </p>
                <span className="text-xs text-primary font-semibold">
                  {booking.showtime.auditorium.screenType}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Booking Ref
                </span>
                <p className="text-base font-black font-mono text-amber-400">
                  {booking.bookingReference}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Date
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{formatDate(booking.showtime.startTime)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Time
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{formatTime(booking.showtime.startTime)}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Total Paid
                </span>
                <p className="text-base font-black text-emerald-400">
                  {formatCents(booking.totalCents)}
                </p>
              </div>
            </div>

            {/* Reserved Seats List */}
            <div className="pt-4 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Reserved Seats ({booking.items.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {booking.items.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1.5 rounded-xl bg-surface-raised border border-primary/40 text-xs font-bold text-white flex items-center gap-1.5 shadow"
                  >
                    <TicketIcon className="w-3.5 h-3.5 text-primary" />
                    {item.seatLabel} ({item.seatType})
                  </span>
                ))}
              </div>
            </div>

            {/* Customer Details */}
            <div className="text-xs text-slate-400 flex items-center justify-between pt-2">
              <span>Customer: <strong className="text-slate-200">{booking.customerName}</strong></span>
              <span>Email: <strong className="text-slate-200">{booking.customerEmail}</strong></span>
            </div>
          </div>

          {/* QR Code Column */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-900 border-2 border-dashed border-slate-300 space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Scan at Entrance
            </span>

            {firstTicket?.qrCodeData ? (
              <img
                src={firstTicket.qrCodeData}
                alt="Ticket QR Code"
                className="w-36 h-36 rounded-lg shadow-sm"
              />
            ) : (
              <div className="w-36 h-36 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                QR Code Loading...
              </div>
            )}

            <span className="text-[11px] font-mono font-bold text-slate-700">
              {firstTicket?.ticketCode || booking.bookingReference}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
