import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { movies, movieGenres, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createMovieSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  synopsis: z.string().min(5, "Synopsis is required"),
  posterUrl: z.string().url("Valid poster URL is required"),
  backdropUrl: z.string().url("Valid backdrop URL is required"),
  trailerUrl: z.string().optional(),
  durationMins: z.number().min(1, "Duration must be positive"),
  releaseDate: z.string(),
  ageRating: z.string().default("PG-13"),
  language: z.string().default("English"),
  director: z.string().optional(),
  cast: z.array(z.string()).default([]),
  formats: z.array(z.string()).default(["2D", "3D"]),
  ratingScore: z.number().default(85),
  isFeatured: z.boolean().default(false),
  genreIds: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const allMovies = await db.query.movies.findMany({
      orderBy: [desc(movies.createdAt)],
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
      },
    });
    return NextResponse.json({ movies: allMovies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = createMovieSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const releaseDate = new Date(data.releaseDate);

    const [newMovie] = await db
      .insert(movies)
      .values({
        title: data.title,
        slug: data.slug,
        synopsis: data.synopsis,
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl || null,
        durationMins: data.durationMins,
        releaseDate,
        ageRating: data.ageRating,
        language: data.language,
        director: data.director || null,
        cast: data.cast,
        formats: data.formats,
        ratingScore: data.ratingScore,
        isFeatured: data.isFeatured,
      })
      .returning();

    // Link genres
    for (const gId of data.genreIds) {
      await db.insert(movieGenres).values({ movieId: newMovie.id, genreId: gId });
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "ADMIN_MOVIE_CREATED",
      entityType: "movie",
      entityId: newMovie.id,
      payload: { title: newMovie.title, slug: newMovie.slug },
    });

    return NextResponse.json({ success: true, movie: newMovie });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
