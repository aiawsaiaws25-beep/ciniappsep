import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { movies, showtimes } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const movie = await db.query.movies.findFirst({
      where: isUuid ? eq(movies.id, id) : eq(movies.slug, id),
      with: {
        movieGenres: {
          with: {
            genre: true,
          },
        },
        showtimes: {
          where: and(
            eq(showtimes.isActive, true),
            gte(showtimes.startTime, new Date(Date.now() - 30 * 60 * 1000)) // Include currently active / recent
          ),
          with: {
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
          orderBy: (showtimes, { asc }) => [asc(showtimes.startTime)],
        },
      },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ movie });
  } catch (error: any) {
    console.error("Error fetching movie:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch movie" }, { status: 500 });
  }
}
