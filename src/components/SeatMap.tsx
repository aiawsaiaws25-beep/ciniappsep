"use client";

import React from "react";
import { formatCents } from "@/lib/utils";
import { Sparkles, User, Check, X, Clock, ShieldAlert } from "lucide-react";

export interface SeatItem {
  id: string;
  showtimeSeatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: "STANDARD" | "VIP" | "RECLINER" | "ACCESSIBLE" | string;
  priceCents: number;
  status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED" | string;
  heldUntil?: Date | null;
}

interface SeatMapProps {
  rows: Record<string, SeatItem[]>;
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatItem) => void;
  maxSeats?: number;
}

export default function SeatMap({
  rows,
  selectedSeatIds,
  onToggleSeat,
  maxSeats = 8,
}: SeatMapProps) {
  const rowKeys = Object.keys(rows).sort();

  return (
    <div className="w-full flex flex-col items-center py-6 select-none">
      {/* 1. Cinema Screen Curve */}
      <div className="w-full max-w-2xl px-6 mb-12 flex flex-col items-center">
        <div className="w-full cinema-screen mb-3" />
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
          <span>All Eyes This Way • Cinema Screen</span>
        </div>
      </div>

      {/* 2. Seat Grid */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center">
        <div className="inline-block min-w-[580px] space-y-3 px-4">
          {rowKeys.map((rowLabel) => {
            const rowSeats = rows[rowLabel];
            return (
              <div key={rowLabel} className="flex items-center justify-center gap-2 sm:gap-3">
                {/* Row Label (Left) */}
                <div className="w-6 text-center text-xs font-bold text-slate-500">
                  {rowLabel}
                </div>

                {/* Seats in Row */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isBooked = seat.status === "BOOKED";
                    const isHeld = seat.status === "HELD";
                    const isBlocked = seat.status === "BLOCKED";
                    const isAvailable = seat.status === "AVAILABLE";

                    let seatBg = "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-primary/80 hover:bg-slate-700";
                    let title = `Row ${seat.rowLabel} Seat ${seat.seatNumber} (${seat.seatType}) - ${formatCents(seat.priceCents)}`;

                    if (isBooked) {
                      seatBg = "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-40";
                      title += " - Already Booked";
                    } else if (isBlocked) {
                      seatBg = "bg-red-950/40 border-red-900/60 text-red-700 cursor-not-allowed opacity-60";
                      title += " - Blocked for Maintenance";
                    } else if (isHeld) {
                      seatBg = "bg-amber-950/40 border-amber-800/60 text-amber-500 cursor-not-allowed animate-pulse";
                      title += " - Temporarily Held";
                    } else if (isSelected) {
                      seatBg = "bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/40 scale-105 font-bold";
                    } else if (seat.seatType === "VIP" || seat.seatType === "RECLINER") {
                      seatBg = "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/40 hover:border-amber-400";
                    } else if (seat.seatType === "ACCESSIBLE") {
                      seatBg = "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/40 hover:border-cyan-400";
                    }

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={!isAvailable && !isSelected}
                        onClick={() => onToggleSeat(seat)}
                        title={title}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all duration-150 relative ${seatBg}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isBooked ? (
                          <X className="w-3.5 h-3.5 opacity-40" />
                        ) : isHeld ? (
                          <Clock className="w-3 h-3 text-amber-400" />
                        ) : isBlocked ? (
                          <ShieldAlert className="w-3 h-3 text-red-500" />
                        ) : (
                          seat.seatNumber
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row Label (Right) */}
                <div className="w-6 text-center text-xs font-bold text-slate-500">
                  {rowLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Seat Map Legend */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4 py-3 rounded-2xl bg-surface-raised border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-800 border border-slate-700" />
          <span className="text-slate-400">Available</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-emerald-500 border border-emerald-400 shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-200 font-medium">Selected</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-amber-500/20 border border-amber-500/50" />
          <span className="text-amber-400 font-medium">VIP / Luxe</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-amber-950/60 border border-amber-800 flex items-center justify-center">
            <Clock className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span className="text-amber-400">Held (10m)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-slate-900 border border-slate-800 opacity-40 flex items-center justify-center">
            <X className="w-2.5 h-2.5 text-slate-500" />
          </div>
          <span className="text-slate-500">Sold Out</span>
        </div>
      </div>
    </div>
  );
}
