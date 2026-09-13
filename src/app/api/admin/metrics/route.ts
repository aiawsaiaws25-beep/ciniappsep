import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { bookings, showtimes, movies, users, auditLogs, showtimeSeats } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // 1. Total revenue from confirmed bookings (sum of total_cents)
    const revenueResult = await db
      .select({
        totalRevenueCents: sql<number>`COALESCE(SUM(total_cents), 0)`,
        confirmedCount: sql<number>`COUNT(*)`,
      })
      .from(bookings)
      .where(eq(bookings.status, "CONFIRMED"));

    const totalRevenueCents = Number(revenueResult[0]?.totalRevenueCents || 0);
    const totalConfirmedBookings = Number(revenueResult[0]?.confirmedCount || 0);

    // 2. Count metrics
    const [moviesCount] = await db.select({ count: sql<number>`count(*)` }).from(movies).where(eq(movies.isActive, true));
    const [showtimesCount] = await db.select({ count: sql<number>`count(*)` }).from(showtimes).where(eq(showtimes.isActive, true));
    const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);

    // 3. Seat occupancy rate
    const seatStats = await db
      .select({
        total: sql<number>`count(*)`,
        booked: sql<number>`count(*) filter (where status = 'BOOKED')`,
        held: sql<number>`count(*) filter (where status = 'HELD')`,
      })
      .from(showtimeSeats);

    const totalSeatsInPlay = Number(seatStats[0]?.total || 1);
    const bookedSeats = Number(seatStats[0]?.booked || 0);
    const occupancyRate = Math.round((bookedSeats / (totalSeatsInPlay || 1)) * 100);

    // 4. Recent bookings
    const recentBookings = await db.query.bookings.findMany({
      orderBy: [desc(bookings.createdAt)],
      limit: 8,
      with: {
        showtime: {
          with: {
            movie: true,
            auditorium: {
              with: {
                cinema: true,
              },
            },
          },
        },
      },
    });

    // 5. Recent audit logs
    const recentLogs = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      limit: 10,
    });

    return NextResponse.json({
      metrics: {
        totalRevenueCents,
        totalConfirmedBookings,
        activeMovies: Number(moviesCount?.count || 0),
        activeShowtimes: Number(showtimesCount?.count || 0),
        totalRegisteredUsers: Number(usersCount?.count || 0),
        occupancyRate,
      },
      recentBookings,
      recentLogs,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Unauthorized admin access." }, { status: 403 });
    }
    return NextResponse.json({ error: error.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
