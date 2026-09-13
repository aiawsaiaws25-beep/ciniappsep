import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { holdSeatsTransaction } from "@/db/transactions/booking";
import { z } from "zod";

const holdRequestSchema = z.object({
  showtimeId: z.string().uuid("Invalid showtime ID"),
  seatIds: z.array(z.string().uuid("Invalid seat ID")).min(1, "At least one seat must be selected"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const body = await req.json();
    const parsed = holdRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { showtimeId, seatIds, customerName, customerEmail, customerPhone, idempotencyKey } =
      parsed.data;

    // Use session user id if logged in; otherwise fallback to guest UUID or anonymous ID
    const userId = session?.id || "00000000-0000-0000-0000-000000000000";

    // If guest user ID, ensure fallback user exists or use demo user ID
    let finalUserId = userId;
    if (finalUserId === "00000000-0000-0000-0000-000000000000") {
      // Find demo user or first user to link
      const { db } = await import("@/db");
      const firstUser = await db.query.users.findFirst();
      if (firstUser) {
        finalUserId = firstUser.id;
      }
    }

    const result = await holdSeatsTransaction({
      userId: finalUserId,
      showtimeId,
      seatIds,
      customerName,
      customerEmail,
      customerPhone,
      idempotencyKey,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error creating seat hold:", error);

    // Differentiate concurrency conflict from bad requests
    const isConflict =
      error.message?.includes("already booked") ||
      error.message?.includes("currently held") ||
      error.message?.includes("blocked");

    return NextResponse.json(
      { error: error.message || "Failed to reserve seats" },
      { status: isConflict ? 409 : 400 }
    );
  }
}
