import { db } from "../src/db";
import { showtimes, seats, showtimeSeats, bookings, users } from "../src/db/schema";
import { holdSeatsTransaction, releaseExpiredSeatHolds } from "../src/db/transactions/booking";
import { eq, sql } from "drizzle-orm";

async function runExpiredHoldTest() {
  console.log("🧪 [QA Agent] Starting Expired Seat Hold Release Test...");

  const showtime = await db.query.showtimes.findFirst({
    where: eq(showtimes.isActive, true),
    with: {
      auditorium: {
        with: {
          seats: true,
        },
      },
    },
  });

  if (!showtime) {
    console.error("No showtime found.");
    process.exit(1);
  }

  const testSeat = showtime.auditorium.seats[1];
  const user = await db.query.users.findFirst();

  // Reset seat
  await db
    .update(showtimeSeats)
    .set({ status: "AVAILABLE", heldUntil: null, bookingId: null })
    .where(sql`showtime_id = ${showtime.id} AND seat_id = ${testSeat.id}`);

  // Create hold
  const hold = await holdSeatsTransaction({
    userId: user!.id,
    showtimeId: showtime.id,
    seatIds: [testSeat.id],
    customerName: "Hold Tester",
    customerEmail: "holdtester@cinebook.test",
  });

  console.log(`🔒 Created hold for booking ${hold.bookingReference}`);

  // Artificially expire the hold timestamp by setting held_until to 1 hour ago
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  await db
    .update(showtimeSeats)
    .set({ heldUntil: oneHourAgo })
    .where(sql`showtime_id = ${showtime.id} AND seat_id = ${testSeat.id}`);

  console.log("⏳ Simulating expiration (held_until set to past UTC timestamp)...");

  // Run cleanup worker
  const cleanupResult = await releaseExpiredSeatHolds();
  console.log(`🧹 Cleanup Worker ran: Released ${cleanupResult.releasedSeatsCount} expired seats, marked ${cleanupResult.expiredBookingsCount} bookings as EXPIRED.`);

  // Check seat status in database
  const updatedSeat = await db.query.showtimeSeats.findFirst({
    where: sql`showtime_id = ${showtime.id} AND seat_id = ${testSeat.id}`,
  });

  if (updatedSeat?.status === "AVAILABLE" && updatedSeat?.heldUntil === null) {
    console.log("🎉 PASS: Expired hold was released back to AVAILABLE status.");
  } else {
    console.error(`❌ FAIL: Seat status is still ${updatedSeat?.status}`);
    process.exit(1);
  }
}

runExpiredHoldTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
