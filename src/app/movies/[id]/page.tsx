"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatCents, formatDate, formatTime, formatDuration } from "@/lib/utils";
import {
  Star,
  Clock,
  Calendar,
  Film,
  Play,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";

interface ShowtimeItem {
  id: string;
  startTime: string;
  endTime: string;
  basePriceCents: number;
  format: string;
  language: string;
  auditorium: {
    id: string;
    name: string;
    screenType: string;
    cinema: {
      id: string;
      name: string;
      slug: string;
      address: string;
      city: string;
      state: string;
    };
  };
}

interface MovieDetails {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  durationMins: number;
  releaseDate: string;
  ageRating: string;
  language: string;
  director?: string;
  cast: string[];
  formats: string[];
  ratingScore: number;
  movieGenres: Array<{ genre: { name: string; slug: string } }>;
  showtimes: ShowtimeItem[];
}

export default function MovieDetailPage({ params }: { params: { id: string } }) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    async function fetchMovie() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/movies/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setMovie(data.movie);

          // Set default selected date to the first available showtime date
          if (data.movie.showtimes && data.movie.showtimes.length > 0) {
            const firstDate = new Date(data.movie.showtimes[0].startTime).toISOString().split("T")[0];
            setSelectedDate(firstDate);
          } else {
            setSelectedDate(new Date().toISOString().split("T")[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load movie details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMovie();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Film className="w-16 h-16 text-slate-600" />
        <h2 className="text-2xl font-bold text-white">Movie Not Found</h2>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-primary text-xs font-bold text-white">
          Back to Movies
        </Link>
      </div>
    );
  }

  // Generate 7-day date tabs
  const dates: Array<{ dateStr: string; label: string; dayName: string }> = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" });
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dates.push({ dateStr, label, dayName });
  }

  // Filter showtimes for the selected date
  const filteredShowtimes = movie.showtimes.filter((st) => {
    const stDate = new Date(st.startTime).toISOString().split("T")[0];
    return stDate === selectedDate;
  });

  // Group filtered showtimes by cinema
  const cinemaGroups: Record<
    string,
    { cinema: ShowtimeItem["auditorium"]["cinema"]; showtimes: ShowtimeItem[] }
  > = {};

  for (const st of filteredShowtimes) {
    const cId = st.auditorium.cinema.id;
    if (!cinemaGroups[cId]) {
      cinemaGroups[cId] = {
        cinema: st.auditorium.cinema,
        showtimes: [],
      };
    }
    cinemaGroups[cId].showtimes.push(st);
  }

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Backdrop Hero */}
      <section className="relative min-h-[460px] sm:min-h-[520px] w-full flex items-end pb-12 overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-slate-950">
          <Image
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            fill
            priority
            className="object-cover opacity-40 filter brightness-90 saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-8">
            {/* Poster thumbnail */}
            <div className="relative w-44 sm:w-56 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 shrink-0 bg-slate-900">
              <Image src={movie.posterUrl} alt={movie.title} fill className="object-cover" />
            </div>

            {/* Movie Info */}
            <div className="space-y-4 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-black/70 border border-white/20 text-xs font-bold text-white">
                  {movie.ageRating}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {(movie.ratingScore / 10).toFixed(1)} / 10
                </span>
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatDuration(movie.durationMins)}
                </span>
                <span className="text-xs text-slate-400">• {movie.language}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>

              {/* Genres */}
              <div className="flex flex-wrap gap-2">
                {movie.movieGenres.map((mg) => (
                  <span
                    key={mg.genre.slug}
                    className="px-3 py-1 rounded-full bg-surface-raised border border-white/10 text-xs font-semibold text-slate-300"
                  >
                    {mg.genre.name}
                  </span>
                ))}
              </div>

              {/* Formats and Trailer CTA */}
              <div className="flex items-center gap-4 pt-2">
                {movie.trailerUrl && (
                  <button
                    onClick={() => setShowTrailerModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white backdrop-blur-md transition-all shadow"
                  >
                    <Play className="w-4 h-4 text-primary fill-primary" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Synopsis & Details Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Col: Synopsis & Cast */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 sm:p-8 rounded-3xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <span>Synopsis</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {movie.synopsis}
            </p>

            {movie.director && (
              <div className="pt-4 border-t border-white/10 text-xs text-slate-400">
                <span className="font-bold text-white">Director:</span> {movie.director}
              </div>
            )}

            {movie.cast && movie.cast.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-white block mb-2">Key Cast:</span>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((actor) => (
                    <span
                      key={actor}
                      className="px-3 py-1 rounded-lg bg-surface-raised border border-white/5 text-xs text-slate-300"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Showtime Selector by Cinema */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <span>Select Date & Showtimes</span>
              </h2>
            </div>

            {/* Date Tabs */}
            <div className="flex overflow-x-auto gap-3 pb-2">
              {dates.map((d) => {
                const isSelected = selectedDate === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[90px] py-3 px-4 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-105"
                        : "bg-surface-card border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {d.dayName}
                    </span>
                    <span className="text-sm font-extrabold mt-0.5">{d.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cinema Showtimes Listing */}
            <div className="space-y-6">
              {Object.keys(cinemaGroups).length > 0 ? (
                Object.values(cinemaGroups).map(({ cinema, showtimes }) => (
                  <div
                    key={cinema.id}
                    className="p-6 rounded-3xl glass-card border border-white/10 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{cinema.name}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cinema.address}, {cinema.city}
                        </p>
                      </div>
                    </div>

                    {/* Showtime Pills */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {showtimes.map((st) => (
                        <Link
                          key={st.id}
                          href={`/booking/${st.id}`}
                          className="group/st flex flex-col p-3 px-4 rounded-2xl bg-surface-raised border border-white/10 hover:border-primary hover:bg-primary/10 transition-all duration-200 shadow-md hover:scale-105"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white group-hover/st:text-primary">
                              {formatTime(st.startTime)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-black text-primary uppercase">
                              {st.format}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 mt-1">
                            <span>{st.auditorium.name}</span>
                            <span className="text-amber-400 font-bold">
                              From {formatCents(st.basePriceCents)}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 rounded-3xl glass-card text-center space-y-3">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    No Showtimes Scheduled for this Date
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Please choose another date from the calendar tabs above to explore scheduled screenings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Cinema Highlights */}
        <div className="space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Auditorium Features</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-surface-raised border border-white/5 space-y-1">
                <span className="font-bold text-white block">IMAX with Laser</span>
                <p className="text-slate-400 text-[11px]">
                  Custom dual-laser projection system for crystal clear visuals and 12-channel surround sound.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised border border-white/5 space-y-1">
                <span className="font-bold text-white block">Dolby Atmos Audio</span>
                <p className="text-slate-400 text-[11px]">
                  Sound moves all around you in three-dimensional space with individual speaker calibration.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface-raised border border-white/5 space-y-1">
                <span className="font-bold text-white block">VIP Recliner Beds</span>
                <p className="text-slate-400 text-[11px]">
                  Full electronic recline with personal dining tables and in-seat gourmet service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      {showTrailerModal && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-surface-card rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">{movie.title} - Official Trailer</h3>
              <button
                onClick={() => setShowTrailerModal(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerUrl.split("v=")[1]?.split("&")[0] || ""}?autoplay=1`}
                title="Trailer"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
