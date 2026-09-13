"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { Sparkles, Film, Compass, Play, Search, ShieldCheck, Ticket, Star, ChevronRight, Zap } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  durationMins: number;
  ageRating: string;
  ratingScore: number;
  language: string;
  formats: string[];
  isFeatured: boolean;
  movieGenres?: Array<{ genre: { name: string; slug: string } }>;
}

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (selectedGenre) params.set("genre", selectedGenre);
        if (selectedFormat) params.set("format", selectedFormat);
        if (searchQuery) params.set("search", searchQuery);

        const res = await fetch(`/api/movies?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setMovies(data.movies || []);
          if (data.genres && genres.length === 0) {
            setGenres(data.genres);
          }
        }
      } catch (err) {
        console.error("Failed to load movies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedGenre, selectedFormat, searchQuery]);

  const featuredMovie = movies.find((m) => m.isFeatured) || movies[0];

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      {featuredMovie && (
        <section className="relative min-h-[560px] sm:min-h-[640px] w-full flex items-center overflow-hidden border-b border-white/10">
          {/* Backdrop Image */}
          <div className="absolute inset-0 bg-slate-950">
            <Image
              src={featuredMovie.backdropUrl || featuredMovie.posterUrl}
              alt={featuredMovie.title}
              fill
              priority
              className="object-cover opacity-35 filter brightness-90 saturate-125"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-6">
              {/* Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/40 text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5 shadow-lg shadow-primary/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Blockbuster
                </span>
                <span className="px-2.5 py-0.5 rounded bg-black/60 border border-white/20 text-xs font-bold text-slate-300">
                  {featuredMovie.ageRating}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {(featuredMovie.ratingScore / 10).toFixed(1)}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
                {featuredMovie.title}
              </h1>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed line-clamp-3">
                {featuredMovie.synopsis}
              </p>

              {/* Formats Pills */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available in:
                </span>
                {featuredMovie.formats.map((f) => (
                  <span
                    key={f}
                    className="px-2.5 py-1 rounded-lg bg-surface-raised border border-white/10 text-xs font-bold text-white shadow-sm"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  href={`/movies/${featuredMovie.slug || featuredMovie.id}`}
                  className="px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-sm font-extrabold text-white shadow-xl shadow-primary/30 flex items-center gap-2.5 transition-all duration-200 hover:scale-105"
                >
                  <Ticket className="w-5 h-5" />
                  <span>Book Tickets Now</span>
                </Link>

                {featuredMovie.trailerUrl && (
                  <a
                    href={featuredMovie.trailerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-4 rounded-2xl bg-surface-raised/80 hover:bg-white/10 border border-white/10 text-sm font-bold text-white flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4 text-primary fill-primary" />
                    <span>Watch Trailer</span>
                  </a>
                )}
              </div>
            </div>

            {/* Poster Card Floating Preview */}
            <div className="hidden lg:block relative w-72 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-white/20 transform rotate-2 hover:rotate-0 transition-transform duration-300">
              <Image
                src={featuredMovie.posterUrl}
                alt={featuredMovie.title}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* 2. Filter Bar & Search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="now-showing">
        <div className="p-6 rounded-3xl glass-card space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <Film className="w-6 h-6 text-primary" />
                <span>Now Showing & Scheduled</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Explore movies showing across our premium IMAX and Dolby Atmos auditoriums.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-primary transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Genre & Format Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setSelectedGenre("")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedGenre === ""
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-surface-raised text-slate-300 hover:text-white border border-white/10"
              }`}
            >
              All Genres
            </button>

            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(selectedGenre === g.slug ? "" : g.slug)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedGenre === g.slug
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-surface-raised text-slate-300 hover:text-white border border-white/10"
                }`}
              >
                {g.name}
              </button>
            ))}

            <div className="h-4 w-[1px] bg-white/10 mx-2 hidden sm:block" />

            {/* Format filters */}
            {["IMAX", "DOLBY_ATMOS", "3D"].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(selectedFormat === fmt ? "" : fmt)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedFormat === fmt
                    ? "bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30"
                    : "bg-surface-raised text-amber-400 hover:text-amber-300 border border-amber-500/20"
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Movie Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-[2/3] rounded-2xl bg-surface-card animate-pulse border border-white/5" />
              ))}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 p-8 rounded-3xl glass-card space-y-4">
              <Film className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-white">No Movies Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No movies matched your filter criteria. Try selecting "All Genres" or clearing your search term.
              </p>
              <button
                onClick={() => {
                  setSelectedGenre("");
                  setSelectedFormat("");
                  setSearchQuery("");
                }}
                className="px-5 py-2.5 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-hover shadow"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Experience Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8" id="experiences">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">
            The CineBook Advantage
          </span>
          <h2 className="text-3xl font-black text-white">Cinema Elevated to Perfection</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 rounded-3xl space-y-4 border border-white/10 hover:border-primary/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instant 10-Min Hold Locking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When you choose your seats, our transactional concurrency engine locks your seats in Neon PostgreSQL for 10 minutes so nobody else can take them.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-4 border border-white/10 hover:border-amber-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">IMAX with Laser & Dolby Atmos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unmatched 4K laser projection paired with immersive spatial audio that flows all around you, including overhead.
            </p>
          </div>

          <div className="glass-card p-8 rounded-3xl space-y-4 border border-white/10 hover:border-emerald-500/50 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Digital QR Boarding Pass</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Skip all box-office queues. Simply scan your cryptographic digital ticket at the usher entrance directly from your smartphone.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
