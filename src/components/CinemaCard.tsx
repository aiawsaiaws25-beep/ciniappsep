import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Film, Sparkles } from "lucide-react";

interface CinemaCardProps {
  cinema: {
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
    auditoriums?: Array<{ id: string; name: string; screenType: string }>;
  };
}

export default function CinemaCard({ cinema }: CinemaCardProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300">
      <div className="relative h-48 w-full bg-slate-900">
        <Image
          src={cinema.imageUrl || "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80"}
          alt={cinema.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs font-bold text-white">
            {cinema.city}, {cinema.state}
          </span>
          <span className="text-xs text-slate-300 font-medium bg-primary/80 px-2.5 py-0.5 rounded-full">
            {cinema.auditoriums?.length || 3} Screens
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white hover:text-primary transition-colors">
            {cinema.name}
          </h3>

          <div className="flex items-start gap-2 text-xs text-slate-400">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>{cinema.address}, {cinema.city}, {cinema.state} {cinema.postalCode}</span>
          </div>

          {cinema.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{cinema.phone}</span>
            </div>
          )}

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {cinema.amenities.map((amenity) => (
              <span
                key={amenity}
                className="px-2.5 py-1 rounded-lg bg-surface-raised border border-white/5 text-[11px] font-medium text-slate-300 flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                {amenity}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/cinemas/${cinema.slug || cinema.id}`}
          className="w-full py-2.5 rounded-xl bg-surface-raised hover:bg-primary text-xs font-bold text-white text-center border border-white/10 hover:border-primary transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Film className="w-4 h-4" />
          <span>View Auditoriums & Showtimes</span>
        </Link>
      </div>
    </div>
  );
}
