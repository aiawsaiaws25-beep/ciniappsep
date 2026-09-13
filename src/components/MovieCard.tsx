import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Sparkles } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface MovieCardProps {
  movie: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string;
    durationMins: number;
    ageRating: string;
    ratingScore: number;
    language: string;
    formats: string[];
    movieGenres?: Array<{ genre: { name: string; slug: string } }>;
  };
}

export default function MovieCard({ movie }: MovieCardProps) {
  return (
    <div className="group relative flex flex-col rounded-2xl bg-surface-card border border-white/10 overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1.5">
      {/* Poster with overlays */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900">
        <Image
          src={movie.posterUrl}
          alt={movie.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-card via-transparent to-transparent opacity-80" />

        {/* Rating Score Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-400 shadow-lg">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{(movie.ratingScore / 10).toFixed(1)}</span>
        </div>

        {/* Age rating */}
        <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/20 text-[11px] font-bold text-white uppercase tracking-wider">
          {movie.ageRating}
        </div>

        {/* Format Badges */}
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
          {movie.formats.slice(0, 3).map((f) => (
            <span
              key={f}
              className="px-2 py-0.5 rounded-full bg-primary/90 text-[10px] font-extrabold text-white uppercase tracking-wider shadow"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Movie Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Genres */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {movie.movieGenres?.slice(0, 2).map((mg) => (
              <span key={mg.genre.slug} className="text-[11px] font-medium text-slate-400">
                {mg.genre.name} •
              </span>
            ))}
            <span className="text-[11px] font-medium text-slate-400">{movie.language}</span>
          </div>

          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">
            {movie.title}
          </h3>

          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{formatDuration(movie.durationMins)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/movies/${movie.slug || movie.id}`}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-surface-raised hover:bg-primary text-xs font-bold text-slate-200 hover:text-white border border-white/10 hover:border-primary flex items-center justify-center gap-2 transition-all duration-200 shadow-md group/btn"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover/btn:rotate-12 transition-transform" />
          <span>Select Showtimes</span>
        </Link>
      </div>
    </div>
  );
}
