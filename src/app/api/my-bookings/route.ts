import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userBookings = await db.query.bookings.findMany({
      where: eq(bookings.userId, session.id),
      with: {
        items: true,
        tickets: true,
        payments: true,
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
      orderBy: [desc(bookings.createdAt)],
    });

    return NextResponse.json({ bookings: userBookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch bookings" }, { status: 500 });
  }
}
