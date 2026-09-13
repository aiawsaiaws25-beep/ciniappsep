"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatTime, formatCents, formatDate } from "@/lib/utils";
import { MapPin, Phone, Film, Sparkles, Clock, Calendar } from "lucide-react";

interface CinemaDetail {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone?: string | null;
  imageUrl?: string | null;
  amenities: string[];
  auditoriums: Array<{
    id: string;
    name: string;
    screenType: string;
    totalSeats: number;
    showtimes: Array<{
      id: string;
      startTime: string;
      basePriceCents: number;
      format: string;
      movie: {
        id: string;
        title: string;
        posterUrl: string;
        durationMins: number;
        ageRating: string;
      };
    }>;
  }>;
}

export default function CinemaDetailPage({ params }: { params: { id: string } }) {
  const [cinema, setCinema] = useState<CinemaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCinema() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/cinemas/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setCinema(data.cinema);
        }
      } catch (err) {
        console.error("Failed to load cinema:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCinema();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!cinema) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <MapPin className="w-16 h-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Cinema Location Not Found</h2>
        <Link href="/cinemas" className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white">
          Back to Cinemas
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24">
      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-card border border-white/10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
            {cinema.city}, {cinema.state}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">{cinema.name}</h1>
          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <span>{cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}</span>
          </p>
          {cinema.phone && (
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>{cinema.phone}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            {cinema.amenities.map((a) => (
              <span
                key={a}
                className="px-3 py-1 rounded-lg bg-surface-raised border border-white/10 text-xs text-slate-300 flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                {a}
              </span>
            ))}
          </div>
        </div>

        {cinema.imageUrl && (
          <div className="relative w-full md:w-80 h-52 rounded-2xl overflow-hidden shadow-xl border border-white/10">
            <Image src={cinema.imageUrl} alt={cinema.name} fill className="object-cover" />
          </div>
        )}
      </div>

      {/* Auditoriums & Screenings */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Film className="w-6 h-6 text-primary" />
            <span>Auditoriums & Today&apos;s Showtimes</span>
          </h2>
        </div>

        <div className="space-y-6">
          {cinema.auditoriums.map((aud) => (
            <div key={aud.id} className="p-6 sm:p-8 rounded-3xl glass-card space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <span>{aud.name}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-xs font-black text-primary uppercase">
                      {aud.screenType}
                    </span>
                  </h3>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Capacity: {aud.totalSeats} Recliner Seats
                  </span>
                </div>
              </div>

              {/* Showtimes for this Auditorium */}
              {aud.showtimes && aud.showtimes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aud.showtimes.map((st) => (
                    <Link
                      key={st.id}
                      href={`/booking/${st.id}`}
                      className="p-4 rounded-2xl bg-surface-raised border border-white/10 hover:border-primary hover:bg-primary/10 transition-all flex items-center gap-4 group"
                    >
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                        <Image
                          src={st.movie.posterUrl}
                          alt={st.movie.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                          {st.movie.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <Clock className="w-3 h-3 text-primary" />
                          <span className="font-bold text-white">{formatTime(st.startTime)}</span>
                          <span>• {st.format}</span>
                        </div>
                        <div className="text-[11px] text-amber-400 font-bold mt-1">
                          From {formatCents(st.basePriceCents)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No screenings currently scheduled.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
