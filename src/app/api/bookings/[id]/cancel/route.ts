import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { cancelBookingTransaction } from "@/db/transactions/booking";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const session = await getSessionUser(req);

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Customer initiated cancellation";

    // If session exists, use its user ID; if guest, allow cancellation if booking matches
    const userId = session?.id || "";
    const isAdmin = session?.role === "ADMIN";

    const result = await cancelBookingTransaction({
      bookingId: id,
      userId,
      isAdmin,
      reason,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cancellation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 400 }
    );
  }
}
