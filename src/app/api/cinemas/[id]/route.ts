import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas, showtimes } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const cinema = await db.query.cinemas.findFirst({
      where: isUuid ? eq(cinemas.id, id) : eq(cinemas.slug, id),
      with: {
        auditoriums: {
          with: {
            showtimes: {
              where: and(
                eq(showtimes.isActive, true),
                gte(showtimes.startTime, new Date(Date.now() - 30 * 60 * 1000))
              ),
              with: {
                movie: true,
              },
              orderBy: (showtimes, { asc }) => [asc(showtimes.startTime)],
            },
          },
        },
      },
    });

    if (!cinema) {
      return NextResponse.json({ error: "Cinema not found" }, { status: 404 });
    }

    return NextResponse.json({ cinema });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch cinema" }, { status: 500 });
  }
}
