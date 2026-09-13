import { db, schema } from "../index";
import {
  showtimes,
  showtimeSeats,
  seats,
  bookings,
  bookingItems,
  payments,
  tickets,
  auditLogs,
  movies,
  auditoriums,
  cinemas,
} from "../schema";
import { eq, and, inArray, lt, sql } from "drizzle-orm";
import QRCode from "qrcode";

export interface HoldSeatsParams {
  userId: string;
  showtimeId: string;
  seatIds: string[]; // seat UUIDs
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  idempotencyKey?: string;
}

export interface ConfirmPaymentParams {
  bookingId: string;
  paymentIntentId: string;
  provider: "MOCK_TEST" | "STRIPE_TEST";
  idempotencyKey?: string;
  paymentMethod?: string;
  cardLast4?: string;
  amountCents?: number;
}

export interface CancelBookingParams {
  bookingId: string;
  userId: string;
  isAdmin?: boolean;
  reason?: string;
}

// Fixed fee percentages / constants (in minor units)
export const SERVICE_FEE_CENTS = 150; // $1.50 per ticket
export const TAX_RATE_PERCENT = 8; // 8% sales tax

/**
 * Generates a human-friendly booking reference: CNB-XXXXXX
 */
export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CNB-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 1. Transactional Seat Hold (Atomic Lock & Reserve for 10 minutes)
 */
export async function holdSeatsTransaction(params: HoldSeatsParams) {
  const {
    userId,
    showtimeId,
    seatIds,
    customerName,
    customerEmail,
    customerPhone,
    idempotencyKey,
  } = params;

  if (!seatIds || seatIds.length === 0) {
    throw new Error("At least one seat must be selected.");
  }

  // Idempotency check: if a booking with this idempotency key already exists for this user, return it
  if (idempotencyKey) {
    const existing = await db.query.bookings.findFirst({
      where: eq(bookings.idempotencyKey, idempotencyKey),
      with: {
        items: true,
      },
    });
    if (existing) {
      return {
        bookingId: existing.id,
        bookingReference: existing.bookingReference,
        status: existing.status,
        expiresAt: existing.expiresAt,
        totalCents: existing.totalCents,
        isIdempotentReplay: true,
      };
    }
  }

  return await db.transaction(async (tx) => {
    // 1. Fetch showtime and auditorium details
    const showtime = await tx.query.showtimes.findFirst({
      where: and(eq(showtimes.id, showtimeId), eq(showtimes.isActive, true)),
      with: {
        movie: true,
        auditorium: {
          with: {
            cinema: true,
          },
        },
      },
    });

    if (!showtime) {
      throw new Error("Showtime not found or is no longer active.");
    }

    // 2. Lock and fetch requested showtime-seats
    // Using raw SQL for SELECT ... FOR UPDATE on Neon/Postgres
    const lockedSeatsQuery = await tx.execute(sql`
      SELECT ss.id, ss.showtime_id, ss.seat_id, ss.status, ss.held_until, ss.version,
             s.row_label, s.seat_number, s.seat_type, s.price_multiplier_cents
      FROM showtime_seats ss
      JOIN seats s ON ss.seat_id = s.id
      WHERE ss.showtime_id = ${showtimeId}
        AND ss.seat_id IN (${sql.join(seatIds.map((id) => sql`${id}`), sql`, `)})
      FOR UPDATE
    `);

    const rawRows = Array.isArray(lockedSeatsQuery)
      ? lockedSeatsQuery
      : (lockedSeatsQuery as any).rows || [];

    const requestedSeats = rawRows as Array<{
      id: string;
      showtime_id: string;
      seat_id: string;
      status: "AVAILABLE" | "HELD" | "BOOKED" | "BLOCKED";
      held_until: Date | null;
      version: number;
      row_label: string;
      seat_number: number;
      seat_type: string;
      price_multiplier_cents: number;
    }>;

    if (requestedSeats.length !== seatIds.length) {
      throw new Error("One or more selected seats do not exist for this showtime.");
    }

    const now = new Date();

    // 3. Confirm every requested seat is AVAILABLE (or HELD with expired timestamp)
    for (const seat of requestedSeats) {
      if (seat.status === "BOOKED") {
        throw new Error(`Seat ${seat.row_label}${seat.seat_number} is already booked.`);
      }
      if (seat.status === "BLOCKED") {
        throw new Error(`Seat ${seat.row_label}${seat.seat_number} is currently blocked for maintenance.`);
      }
      if (seat.status === "HELD" && seat.held_until && new Date(seat.held_until) > now) {
        throw new Error(`Seat ${seat.row_label}${seat.seat_number} is currently held by another customer.`);
      }
    }

    // 4. Calculate price strictly on the server
    const basePriceCents = showtime.basePriceCents;
    let subtotalCents = 0;
    const itemizedSeats: Array<{
      showtimeSeatId: string;
      seatLabel: string;
      seatType: string;
      unitPriceCents: number;
    }> = [];

    for (const seat of requestedSeats) {
      const seatPrice = basePriceCents + (Number(seat.price_multiplier_cents) || 0);
      subtotalCents += seatPrice;
      itemizedSeats.push({
        showtimeSeatId: seat.id,
        seatLabel: `Row ${seat.row_label} - Seat ${seat.seat_number}`,
        seatType: seat.seat_type,
        unitPriceCents: seatPrice,
      });
    }

    const serviceFeeCents = SERVICE_FEE_CENTS * requestedSeats.length;
    const taxCents = Math.round((subtotalCents + serviceFeeCents) * (TAX_RATE_PERCENT / 100));
    const totalCents = subtotalCents + serviceFeeCents + taxCents;

    // 5. Expiration time: 10 minutes from now (UTC)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const bookingReference = generateBookingReference();

    // 6. Create PENDING booking
    const [newBooking] = await tx
      .insert(bookings)
      .values({
        bookingReference,
        userId,
        showtimeId,
        status: "PENDING",
        subtotalCents,
        serviceFeeCents,
        taxCents,
        totalCents,
        idempotencyKey: idempotencyKey || null,
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        expiresAt,
      })
      .returning();

    // 7. Insert booking items
    for (const item of itemizedSeats) {
      await tx.insert(bookingItems).values({
        bookingId: newBooking.id,
        showtimeSeatId: item.showtimeSeatId,
        seatLabel: item.seatLabel,
        seatType: item.seatType,
        unitPriceCents: item.unitPriceCents,
      });
    }

    // 8. Update showtime_seats to HELD with held_until timestamp and booking_id
    for (const seat of requestedSeats) {
      await tx
        .update(showtimeSeats)
        .set({
          status: "HELD",
          heldUntil: expiresAt,
          bookingId: newBooking.id,
          version: seat.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(showtimeSeats.id, seat.id));
    }

    // 9. Write audit log
    await tx.insert(auditLogs).values({
      userId,
      action: "SEAT_HOLD_CREATED",
      entityType: "booking",
      entityId: newBooking.id,
      payload: {
        bookingReference,
        seatCount: requestedSeats.length,
        seatIds,
        totalCents,
        expiresAt,
      },
    });

    return {
      bookingId: newBooking.id,
      bookingReference: newBooking.bookingReference,
      status: newBooking.status,
      expiresAt: newBooking.expiresAt,
      subtotalCents,
      serviceFeeCents,
      taxCents,
      totalCents,
      itemizedSeats,
      isIdempotentReplay: false,
    };
  });
}

/**
 * 2. Confirm Booking Transaction (After Verified Payment)
 */
export async function confirmBookingTransaction(params: ConfirmPaymentParams) {
  const {
    bookingId,
    paymentIntentId,
    provider,
    idempotencyKey,
    paymentMethod = "card",
    cardLast4 = "4242",
  } = params;

  return await db.transaction(async (tx) => {
    // 1. Fetch booking
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        items: true,
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
      throw new Error("Booking not found.");
    }

    // Idempotent confirmation: if already CONFIRMED, return existing tickets & payment
    if (booking.status === "CONFIRMED") {
      const existingPayment = await tx.query.payments.findFirst({
        where: eq(payments.bookingId, bookingId),
      });
      const existingTickets = await tx.query.tickets.findMany({
        where: eq(tickets.bookingId, bookingId),
      });
      return {
        booking,
        payment: existingPayment,
        tickets: existingTickets,
        isIdempotentReplay: true,
      };
    }

    if (booking.status !== "PENDING") {
      throw new Error(`Booking cannot be confirmed because status is ${booking.status}.`);
    }

    const now = new Date();
    if (new Date(booking.expiresAt) < now) {
      // Mark as EXPIRED
      await tx
        .update(bookings)
        .set({ status: "EXPIRED", updatedAt: now })
        .where(eq(bookings.id, bookingId));
      throw new Error("Seat hold has expired. Please reselect your seats.");
    }

    // 2. Record successful payment
    const [paymentRecord] = await tx
      .insert(payments)
      .values({
        bookingId: booking.id,
        paymentIntentId,
        provider,
        status: "SUCCEEDED",
        amountCents: booking.totalCents,
        currency: "USD",
        idempotencyKey: idempotencyKey || null,
        paymentMethod,
        cardLast4,
        metadata: {
          customerEmail: booking.customerEmail,
          bookingReference: booking.bookingReference,
        },
      })
      .returning();

    // 3. Mark booking as CONFIRMED
    const [updatedBooking] = await tx
      .update(bookings)
      .set({
        status: "CONFIRMED",
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // 4. Update showtime_seats to BOOKED
    const seatIds = booking.items.map((i) => i.showtimeSeatId);
    if (seatIds.length > 0) {
      await tx
        .update(showtimeSeats)
        .set({
          status: "BOOKED",
          heldUntil: null,
          updatedAt: now,
        })
        .where(inArray(showtimeSeats.id, seatIds));
    }

    // 5. Generate digital tickets with QR code for each seat
    const generatedTickets = [];
    for (const item of booking.items) {
      const ticketCode = `TKT-${booking.bookingReference.replace("CNB-", "")}-${item.seatLabel.replace(/[^a-zA-Z0-9]/g, "")}`;
      const qrPayload = JSON.stringify({
        tkt: ticketCode,
        ref: booking.bookingReference,
        mov: booking.showtime.movie.title,
        cin: booking.showtime.auditorium.cinema.name,
        aud: booking.showtime.auditorium.name,
        time: booking.showtime.startTime,
        seat: item.seatLabel,
      });

      const qrCodeData = await QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: "H",
        margin: 2,
        color: {
          dark: "#080B11",
          light: "#FFFFFF",
        },
      });

      const [ticket] = await tx
        .insert(tickets)
        .values({
          bookingId: booking.id,
          ticketCode,
          qrCodeData,
          isUsed: false,
        })
        .returning();

      generatedTickets.push(ticket);
    }

    // 6. Log audit trail
    await tx.insert(auditLogs).values({
      userId: booking.userId,
      action: "BOOKING_CONFIRMED",
      entityType: "booking",
      entityId: booking.id,
      payload: {
        bookingReference: booking.bookingReference,
        totalCents: booking.totalCents,
        paymentId: paymentRecord.id,
        ticketCount: generatedTickets.length,
      },
    });

    return {
      booking: updatedBooking,
      payment: paymentRecord,
      tickets: generatedTickets,
      isIdempotentReplay: false,
    };
  });
}

/**
 * 3. Cancel Booking & Automatic Refund + Seat Liberation
 */
export async function cancelBookingTransaction(params: CancelBookingParams) {
  const { bookingId, userId, isAdmin = false, reason } = params;

  return await db.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: {
        items: true,
        showtime: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found.");
    }

    // Authorization check
    if (!isAdmin && booking.userId !== userId) {
      throw new Error("Unauthorized to cancel this booking.");
    }

    if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
      return { booking, message: "Booking was already cancelled." };
    }

    if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") {
      throw new Error(`Cannot cancel booking in ${booking.status} state.`);
    }

    // Cannot cancel if showtime has already started
    const now = new Date();
    if (new Date(booking.showtime.startTime) <= now) {
      throw new Error("Cannot cancel bookings after showtime has commenced.");
    }

    // Release all booked/held seats back to AVAILABLE
    const seatIds = booking.items.map((i) => i.showtimeSeatId);
    if (seatIds.length > 0) {
      await tx
        .update(showtimeSeats)
        .set({
          status: "AVAILABLE",
          heldUntil: null,
          bookingId: null,
          updatedAt: now,
        })
        .where(inArray(showtimeSeats.id, seatIds));
    }

    // Update payment record if exists
    await tx
      .update(payments)
      .set({
        status: "REFUNDED",
      })
      .where(eq(payments.bookingId, bookingId));

    // Update booking status
    const [updatedBooking] = await tx
      .update(bookings)
      .set({
        status: "REFUNDED",
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Audit log
    await tx.insert(auditLogs).values({
      userId,
      action: "BOOKING_CANCELLED_AND_REFUNDED",
      entityType: "booking",
      entityId: booking.id,
      payload: {
        bookingReference: booking.bookingReference,
        refundAmountCents: booking.totalCents,
        reason: reason || "User initiated cancellation",
      },
    });

    return {
      booking: updatedBooking,
      releasedSeatsCount: seatIds.length,
      refundAmountCents: booking.totalCents,
    };
  });
}

/**
 * 4. Expired Seat Hold Release Worker (Cron / Endpoint)
 * Safe and idempotent.
 */
export async function releaseExpiredSeatHolds(): Promise<{
  releasedSeatsCount: number;
  expiredBookingsCount: number;
}> {
  const now = new Date();

  return await db.transaction(async (tx) => {
    // 1. Find all expired HELD seats
    const expiredSeats = await tx.query.showtimeSeats.findMany({
      where: and(
        eq(showtimeSeats.status, "HELD"),
        lt(showtimeSeats.heldUntil, now)
      ),
    });

    if (expiredSeats.length === 0) {
      return { releasedSeatsCount: 0, expiredBookingsCount: 0 };
    }

    const expiredSeatIds = expiredSeats.map((s) => s.id);
    const linkedBookingIds = Array.from(
      new Set(expiredSeats.map((s) => s.bookingId).filter(Boolean))
    ) as string[];

    // 2. Reset seats to AVAILABLE
    await tx
      .update(showtimeSeats)
      .set({
        status: "AVAILABLE",
        heldUntil: null,
        bookingId: null,
        updatedAt: now,
      })
      .where(inArray(showtimeSeats.id, expiredSeatIds));

    // 3. Mark corresponding pending bookings as EXPIRED
    let expiredBookingsCount = 0;
    if (linkedBookingIds.length > 0) {
      const expiredBookingsResult = await tx
        .update(bookings)
        .set({
          status: "EXPIRED",
          updatedAt: now,
        })
        .where(
          and(
            inArray(bookings.id, linkedBookingIds),
            eq(bookings.status, "PENDING")
          )
        )
        .returning();
      expiredBookingsCount = expiredBookingsResult.length;
    }

    // 4. Record audit log
    await tx.insert(auditLogs).values({
      action: "EXPIRED_SEAT_HOLDS_RELEASED",
      entityType: "seat_cleanup",
      entityId: "cron_worker",
      payload: {
        releasedSeatsCount: expiredSeatIds.length,
        expiredBookingsCount,
        timestamp: now.toISOString(),
      },
    });

    return {
      releasedSeatsCount: expiredSeatIds.length,
      expiredBookingsCount,
    };
  });
}
