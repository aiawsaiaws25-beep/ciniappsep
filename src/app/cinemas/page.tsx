"use client";

import React, { useEffect, useState } from "react";
import CinemaCard from "@/components/CinemaCard";
import { MapPin, Film } from "lucide-react";

interface Cinema {
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
}

export default function CinemasPage() {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCinemas() {
      try {
        const res = await fetch("/api/cinemas");
        if (res.ok) {
          const data = await res.json();
          setCinemas(data.cinemas || []);
        }
      } catch (err) {
        console.error("Failed to load cinemas:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCinemas();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center justify-center gap-1.5">
          <MapPin className="w-4 h-4" />
          Our Destinations
        </span>
        <h1 className="text-4xl font-black text-white tracking-tight">
          CineBook Premier Theaters
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Find luxury recliner auditoriums, IMAX with Laser dome screens, and chef-curated dining experiences near you.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 rounded-3xl bg-surface-card animate-pulse border border-white/5" />
          ))}
        </div>
      ) : cinemas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cinemas.map((cinema) => (
            <CinemaCard key={cinema.id} cinema={cinema} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-3xl glass-card space-y-3">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Cinemas Registered</h3>
          <p className="text-xs text-slate-400">Please seed the database or check back later.</p>
        </div>
      )}
    </div>
  );
}
