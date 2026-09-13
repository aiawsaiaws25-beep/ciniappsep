import { holdSeatsTransaction, releaseExpiredSeatHolds } from "../src/db/transactions/booking";
import { db } from "../src/db";
import { showtimes, seats, showtimeSeats, users } from "../src/db/schema";
import { eq, sql } from "drizzle-orm";

async function runConcurrencyTest() {
  console.log("🧪 [QA Agent] Starting Concurrent Seat-Booking Race Condition Test...");

  // 1. Ensure clean hold state
  await releaseExpiredSeatHolds();

  // 2. Fetch an active showtime and a single test seat
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

  if (!showtime || !showtime.auditorium.seats.length) {
    console.error("❌ No showtime or seats found. Please seed the database first.");
    process.exit(1);
  }

  const targetSeat = showtime.auditorium.seats[0];
  const user = await db.query.users.findFirst();
  const userId = user?.id || "00000000-0000-0000-0000-000000000000";

  // Reset target seat status to AVAILABLE
  await db
    .update(showtimeSeats)
    .set({
      status: "AVAILABLE",
      heldUntil: null,
      bookingId: null,
    })
    .where(
      sql`showtime_id = ${showtime.id} AND seat_id = ${targetSeat.id}`
    );

  console.log(
    `🎯 Target Seat: Row ${targetSeat.rowLabel}-${targetSeat.seatNumber} on Showtime ${showtime.id}`
  );
  console.log("⚡ Firing 10 concurrent seat-hold requests simultaneously...");

  const CONCURRENCY_COUNT = 10;
  const promises: Promise<{ workerId: number; success: boolean; error?: string; bookingId?: string }>[] = [];

  for (let i = 1; i <= CONCURRENCY_COUNT; i++) {
    const workerId = i;
    promises.push(
      (async () => {
        try {
          const result = await holdSeatsTransaction({
            userId,
            showtimeId: showtime.id,
            seatIds: [targetSeat.id],
            customerName: `Concurrent Tester ${workerId}`,
            customerEmail: `tester${workerId}@cinebook.test`,
            idempotencyKey: `test_concurrency_${workerId}_${Date.now()}`,
          });
          return { workerId, success: true, bookingId: result.bookingId };
        } catch (err: any) {
          return { workerId, success: false, error: err.message };
        }
      })()
    );
  }

  const results = await Promise.all(promises);

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  console.log("\n📊 Test Results Summary:");
  results.forEach((r) => {
    if (r.success) {
      console.log(`  ✅ Worker #${r.workerId}: SUCCESS (Booking ID: ${r.bookingId})`);
    } else {
      console.log(`  🛡️ Worker #${r.workerId}: REJECTED AS CONFLICT (${r.error})`);
    }
  });

  console.log(`\nTotal Successes: ${successCount}`);
  console.log(`Total Conflicts/Rejections: ${failureCount}`);

  if (successCount === 1 && failureCount === CONCURRENCY_COUNT - 1) {
    console.log("🎉 PASS: Exactly 1 worker succeeded, 9 were prevented from double-booking.");
  } else {
    console.error(`❌ FAIL: Race condition occurred! Success count = ${successCount}`);
    process.exit(1);
  }
}

runConcurrencyTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
