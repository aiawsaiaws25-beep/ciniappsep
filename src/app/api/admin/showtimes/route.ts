import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { showtimes, showtimeSeats, seats, auditLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const createShowtimeSchema = z.object({
  movieId: z.string().uuid(),
  auditoriumId: z.string().uuid(),
  startTime: z.string(),
  endTime: z.string(),
  basePriceCents: z.number().min(100), // in minor units
  format: z.string().default("2D"),
  language: z.string().default("English"),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const allShowtimes = await db.query.showtimes.findMany({
      orderBy: [desc(showtimes.startTime)],
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
          },
        },
      },
    });
    return NextResponse.json({ showtimes: allShowtimes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = createShowtimeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    const [newShowtime] = await db
      .insert(showtimes)
      .values({
        movieId: data.movieId,
        auditoriumId: data.auditoriumId,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        basePriceCents: data.basePriceCents,
        format: data.format,
        language: data.language,
      })
      .returning();

    // Automatically initialize showtime_seats from auditorium seats
    const auditoriumSeats = await db.query.seats.findMany({
      where: eq(seats.auditoriumId, data.auditoriumId),
    });

    if (auditoriumSeats.length > 0) {
      const seatsPayload = auditoriumSeats.map((s: any) => ({
        showtimeId: newShowtime.id,
        seatId: s.id,
        status: "AVAILABLE" as const,
      }));
      await db.insert(showtimeSeats).values(seatsPayload).onConflictDoNothing();
    }

    // Audit log
    await db.insert(auditLogs).values({
      userId: admin.id,
      action: "ADMIN_SHOWTIME_SCHEDULED",
      entityType: "showtime",
      entityId: newShowtime.id,
      payload: {
        movieId: data.movieId,
        auditoriumId: data.auditoriumId,
        startTime: data.startTime,
        basePriceCents: data.basePriceCents,
      },
    });

    return NextResponse.json({ success: true, showtime: newShowtime });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
