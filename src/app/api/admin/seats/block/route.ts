import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { showtimeSeats, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const blockSeatSchema = z.object({
  showtimeSeatId: z.string().uuid(),
  block: z.boolean(), // true = set to BLOCKED, false = set to AVAILABLE
  reason: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json();
    const parsed = blockSeatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { showtimeSeatId, block, reason } = parsed.data;

    const currentSeat = await db.query.showtimeSeats.findFirst({
      where: eq(showtimeSeats.id, showtimeSeatId),
    });

    if (!currentSeat) {
      return NextResponse.json({ error: "Seat not found" }, { status: 404 });
    }

    if (currentSeat.status === "BOOKED") {
      return NextResponse.json({ error: "Cannot block a seat that is already booked by a customer." }, { status: 400 });
    }

    const newStatus = block ? "BLOCKED" : "AVAILABLE";

    const [updated] = await db
      .update(showtimeSeats)
      .set({
        status: newStatus,
        heldUntil: null,
        bookingId: null,
        updatedAt: new Date(),
      })
      .where(eq(showtimeSeats.id, showtimeSeatId))
      .returning();

    await db.insert(auditLogs).values({
      userId: admin.id,
      action: block ? "ADMIN_SEAT_BLOCKED" : "ADMIN_SEAT_UNBLOCKED",
      entityType: "seat",
      entityId: showtimeSeatId,
      payload: { previousStatus: currentSeat.status, newStatus, reason },
    });

    return NextResponse.json({ success: true, seat: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
