import { db } from "../src/db";
import { showtimes, showtimeSeats, users } from "../src/db/schema";
import { holdSeatsTransaction, confirmBookingTransaction } from "../src/db/transactions/booking";
import { eq, sql } from "drizzle-orm";

async function runIdempotencyTest() {
  console.log("🧪 [QA Agent] Starting Payment Idempotency & Duplicate Replay Test...");

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

  const testSeat = showtime.auditorium.seats[2];
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
    customerName: "Idempotency Tester",
    customerEmail: "idempotency@cinebook.test",
  });

  const sharedIdempotencyKey = `idem_pay_test_${Date.now()}`;

  console.log("💳 Sending Initial Payment Confirmation...");
  const firstPayment = await confirmBookingTransaction({
    bookingId: hold.bookingId,
    paymentIntentId: "pi_test_1st_attempt",
    provider: "MOCK_TEST",
    idempotencyKey: sharedIdempotencyKey,
  });

  console.log(`  Payment 1: Status = ${firstPayment.booking.status}, Replay = ${firstPayment.isIdempotentReplay}`);

  console.log("🔁 Sending Duplicate/Replayed Payment with Same Idempotency Key...");
  const secondPayment = await confirmBookingTransaction({
    bookingId: hold.bookingId,
    paymentIntentId: "pi_test_duplicate_attempt",
    provider: "MOCK_TEST",
    idempotencyKey: sharedIdempotencyKey,
  });

  console.log(`  Payment 2: Status = ${secondPayment.booking.status}, Replay = ${secondPayment.isIdempotentReplay}`);

  if (firstPayment.isIdempotentReplay === false && secondPayment.isIdempotentReplay === true) {
    console.log("🎉 PASS: Duplicate payment requests were intercepted idempotently without double-billing.");
  } else {
    console.error("❌ FAIL: Idempotency failed!");
    process.exit(1);
  }
}

runIdempotencyTest().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
