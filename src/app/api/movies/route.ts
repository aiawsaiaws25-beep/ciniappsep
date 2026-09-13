import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies, movieGenres, genres } from "@/db/schema";
import { eq, ilike, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const genre = searchParams.get("genre") || "";
    const format = searchParams.get("format") || "";
    const language = searchParams.get("language") || "";
    const featuredOnly = searchParams.get("featured") === "true";

    const allMovies = await db.query.movies.findMany({
      where: and(
        eq(movies.isActive, true),
        search ? ilike(movies.title, `%${search}%`) : undefined,
        language ? eq(movies.language, language) : undefined,
        featuredOnly ? eq(movies.isFeatured, true) : undefined
      ),
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
      },
      orderBy: (movies, { desc }) => [desc(movies.ratingScore), desc(movies.releaseDate)],
    });

    // Filter by genre slug or format if specified
    const filtered = allMovies.filter((movie) => {
      if (genre) {
        const hasGenre = movie.movieGenres.some(
          (mg) => mg.genre.slug === genre || mg.genre.name.toLowerCase() === genre.toLowerCase()
        );
        if (!hasGenre) return false;
      }
      if (format) {
        const hasFormat = movie.formats.some(
          (f) => f.toLowerCase() === format.toLowerCase()
        );
        if (!hasFormat) return false;
      }
      return true;
    });

    const allGenres = await db.query.genres.findMany({
      orderBy: (genres, { asc }) => [asc(genres.name)],
    });

    return NextResponse.json({
      movies: filtered,
      genres: allGenres,
    });
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch movies" }, { status: 500 });
  }
}
