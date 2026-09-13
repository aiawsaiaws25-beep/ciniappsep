import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { showtimes, showtimeSeats, seats, auditoriums } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { releaseExpiredSeatHolds } from "@/db/transactions/booking";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Trigger cleanup of any expired holds first
    await releaseExpiredSeatHolds();

    const showtime = await db.query.showtimes.findFirst({
      where: eq(showtimes.id, id),
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
            seats: {
              where: eq(seats.isActive, true),
              orderBy: (s: any, { asc }: any) => [asc(s.rowLabel), asc(s.seatNumber)],
            },
          },
        },
        showtimeSeats: {
          with: {
            seat: true,
          },
        },
      },
    });

    if (!showtime) {
      return NextResponse.json({ error: "Showtime not found" }, { status: 404 });
    }

    // Map physical seats with live showtime seat status
    const statusMap = new Map<string, { status: string; heldUntil: Date | null; showtimeSeatId: string }>();
    for (const ss of showtime.showtimeSeats) {
      const isHoldActive =
        ss.status === "HELD" && ss.heldUntil && new Date(ss.heldUntil) > new Date();

      statusMap.set(ss.seatId, {
        status: ss.status === "HELD" && !isHoldActive ? "AVAILABLE" : ss.status,
        heldUntil: ss.heldUntil,
        showtimeSeatId: ss.id,
      });
    }

    const seatMatrix = showtime.auditorium.seats.map((seat: any) => {
      const liveState = statusMap.get(seat.id) || {
        status: "AVAILABLE",
        heldUntil: null,
        showtimeSeatId: "",
      };

      const finalPriceCents = showtime.basePriceCents + seat.priceMultiplierCents;

      return {
        id: seat.id,
        showtimeSeatId: liveState.showtimeSeatId,
        rowLabel: seat.rowLabel,
        seatNumber: seat.seatNumber,
        seatType: seat.seatType,
        priceCents: finalPriceCents,
        status: liveState.status,
        heldUntil: liveState.heldUntil,
      };
    });

    // Group seats by row
    const rowsMap: Record<string, typeof seatMatrix> = {};
    for (const s of seatMatrix) {
      if (!rowsMap[s.rowLabel]) {
        rowsMap[s.rowLabel] = [];
      }
      rowsMap[s.rowLabel].push(s);
    }

    return NextResponse.json({
      showtime: {
        id: showtime.id,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        basePriceCents: showtime.basePriceCents,
        format: showtime.format,
        language: showtime.language,
        movie: showtime.movie,
        cinema: showtime.auditorium.cinema,
        auditorium: {
          id: showtime.auditorium.id,
          name: showtime.auditorium.name,
          screenType: showtime.auditorium.screenType,
          totalSeats: showtime.auditorium.totalSeats,
        },
      },
      rows: rowsMap,
      seats: seatMatrix,
    });
  } catch (error: any) {
    console.error("Error fetching showtime layout:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch showtime" }, { status: 500 });
  }
}
