"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

interface HoldTimerProps {
  expiresAt: string | Date;
  onExpire?: () => void;
}

export default function HoldTimer({ expiresAt, onExpire }: HoldTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(timer);
        onExpire?.();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isUrgent = secondsRemaining > 0 && secondsRemaining < 120; // under 2 minutes
  const isExpired = secondsRemaining === 0;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
        isExpired
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : isUrgent
          ? "bg-amber-500/20 border-amber-500/50 text-amber-400 animate-pulse shadow-lg shadow-amber-500/20"
          : "bg-surface-raised border-white/10 text-slate-200"
      }`}
    >
      {isUrgent || isExpired ? (
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      ) : (
        <Clock className="w-4 h-4 text-primary shrink-0" />
      )}

      <div>
        {isExpired ? (
          <span>Seat hold expired! Please restart your booking.</span>
        ) : (
          <span>
            Seats reserved for:{" "}
            <span className="text-white font-mono text-sm font-bold">{formattedTime}</span>
          </span>
        )}
      </div>
    </div>
  );
}
