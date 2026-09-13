import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        items: true,
        payments: true,
        tickets: true,
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

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch booking" }, { status: 500 });
  }
}
